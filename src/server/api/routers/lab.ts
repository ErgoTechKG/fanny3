import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { RotationStatus } from '@prisma/client'
import { LabRotationAllocator } from '@/lib/algorithms/lab-rotation'

const labRotationApplicationSchema = z.object({
  semester: z.string().regex(/^\d{4}-\d$/, '学期格式应为YYYY-S (如2024-1)'),
  choices: z.array(z.object({
    order: z.number().min(1).max(3),
    labId: z.string(),
    reason: z.string().min(50, '申请理由至少50字')
  })).min(2, '至少选择2个实验室').max(3, '最多选择3个实验室')
})

const rotationLogSchema = z.object({
  rotationId: z.string(),
  weekNumber: z.number().min(1).max(16),
  content: z.string().min(100, '日志内容至少100字'),
  problems: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  nextPlan: z.string().optional()
})

export const labRouter = createTRPCRouter({
  // Get list of labs
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        researchArea: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit

      const where = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { nameEn: { contains: input.search, mode: 'insensitive' as const } },
            { code: { contains: input.search, mode: 'insensitive' as const } },
            { description: { contains: input.search, mode: 'insensitive' as const } }
          ]
        }),
        ...(input.researchArea && {
          researchAreas: { has: input.researchArea }
        })
      }

      const [labs, total] = await Promise.all([
        ctx.prisma.lab.findMany({
          where,
          include: {
            director: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                department: true
              }
            },
            _count: {
              select: {
                rotations: {
                  where: {
                    status: RotationStatus.IN_PROGRESS,
                    semester: `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 6)}`
                  }
                }
              }
            }
          },
          skip,
          take: input.limit,
          orderBy: { name: 'asc' }
        }),
        ctx.prisma.lab.count({ where })
      ])

      // Add current occupancy info
      const labsWithOccupancy = labs.map(lab => ({
        ...lab,
        currentOccupancy: lab._count.rotations,
        availableSlots: lab.capacity - lab._count.rotations
      }))

      return {
        labs: labsWithOccupancy,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      }
    }),

  // Get lab details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lab = await ctx.prisma.lab.findUnique({
        where: { id: input.id },
        include: {
          director: true,
          rotations: {
            where: {
              status: { in: [RotationStatus.IN_PROGRESS, RotationStatus.COMPLETED] }
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  studentId: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!lab) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '实验室不存在'
        })
      }

      return lab
    }),

  // Apply for lab rotation
  applyRotation: protectedProcedure
    .input(labRotationApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is a student
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { roles: true }
      })

      if (!user?.roles.some(r => r.role === 'STUDENT')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有学生可以申请实验室轮转'
        })
      }

      // Check for existing application
      const existing = await ctx.prisma.labRotationApplication.findUnique({
        where: {
          studentId_semester: {
            studentId: ctx.session.user.id,
            semester: input.semester
          }
        }
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '您已经提交过本学期的轮转申请'
        })
      }

      // Validate lab choices are different
      const labIds = input.choices.map(c => c.labId)
      if (new Set(labIds).size !== labIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '不能重复选择同一个实验室'
        })
      }

      // Validate labs exist
      const labs = await ctx.prisma.lab.findMany({
        where: { id: { in: labIds } }
      })

      if (labs.length !== labIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '选择的实验室无效'
        })
      }

      // Create application
      const application = await ctx.prisma.labRotationApplication.create({
        data: {
          studentId: ctx.session.user.id,
          semester: input.semester,
          choices: input.choices,
          status: RotationStatus.PENDING
        },
        include: {
          student: true
        }
      })

      return {
        success: true,
        message: '实验室轮转申请提交成功',
        data: application
      }
    }),

  // Get my rotation application
  getMyRotation: protectedProcedure
    .input(
      z.object({
        semester: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const semester = input.semester || 
        `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 6)}`

      const application = await ctx.prisma.labRotationApplication.findUnique({
        where: {
          studentId_semester: {
            studentId: ctx.session.user.id,
            semester
          }
        },
        include: {
          assignedLab: {
            include: {
              director: true
            }
          },
          assignedMentor: true,
          logs: {
            orderBy: { weekNumber: 'asc' }
          }
        }
      })

      return application
    }),

  // Submit rotation log
  submitLog: protectedProcedure
    .input(rotationLogSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify rotation exists and belongs to user
      const rotation = await ctx.prisma.labRotationApplication.findFirst({
        where: {
          id: input.rotationId,
          studentId: ctx.session.user.id,
          status: RotationStatus.IN_PROGRESS
        }
      })

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '未找到进行中的轮转记录'
        })
      }

      // Check if log for this week already exists
      const existingLog = await ctx.prisma.rotationLog.findFirst({
        where: {
          rotationId: input.rotationId,
          weekNumber: input.weekNumber
        }
      })

      if (existingLog) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `第${input.weekNumber}周的日志已存在`
        })
      }

      // Create log
      const log = await ctx.prisma.rotationLog.create({
        data: input
      })

      return {
        success: true,
        message: '轮转日志提交成功',
        data: log
      }
    }),

  // Get rotation logs for a student (professor view)
  getStudentLogs: professorProcedure
    .input(
      z.object({
        rotationId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify professor has access
      const rotation = await ctx.prisma.labRotationApplication.findFirst({
        where: {
          id: input.rotationId,
          OR: [
            { assignedMentorId: ctx.session.user.id },
            { assignedLab: { directorId: ctx.session.user.id } }
          ]
        },
        include: {
          student: true,
          assignedLab: true,
          logs: {
            orderBy: { weekNumber: 'asc' }
          }
        }
      })

      if (!rotation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此轮转记录'
        })
      }

      return rotation
    }),

  // Add feedback to rotation log (professor)
  addFeedback: professorProcedure
    .input(
      z.object({
        logId: z.string(),
        feedback: z.string().min(10, '反馈内容至少10字')
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify professor has access
      const log = await ctx.prisma.rotationLog.findFirst({
        where: {
          id: input.logId,
          rotation: {
            OR: [
              { assignedMentorId: ctx.session.user.id },
              { assignedLab: { directorId: ctx.session.user.id } }
            ]
          }
        }
      })

      if (!log) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权添加反馈'
        })
      }

      const updated = await ctx.prisma.rotationLog.update({
        where: { id: input.logId },
        data: {
          mentorFeedback: input.feedback,
          feedbackDate: new Date()
        }
      })

      return {
        success: true,
        message: '反馈添加成功',
        data: updated
      }
    }),

  // Run rotation allocation (admin only)
  runAllocation: adminProcedure
    .input(
      z.object({
        semester: z.string(),
        dryRun: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all pending applications
      const applications = await ctx.prisma.labRotationApplication.findMany({
        where: {
          semester: input.semester,
          status: RotationStatus.PENDING
        }
      })

      if (applications.length === 0) {
        return {
          success: true,
          message: '没有待分配的申请',
          data: { stats: null }
        }
      }

      // Get all labs and their current occupancy
      const labs = await ctx.prisma.lab.findMany({
        include: {
          _count: {
            select: {
              rotations: {
                where: {
                  status: RotationStatus.IN_PROGRESS,
                  semester: input.semester
                }
              }
            }
          }
        }
      })

      // Calculate available capacity
      const labCapacities = new Map<string, number>()
      for (const lab of labs) {
        const available = lab.capacity - lab._count.rotations
        if (available > 0) {
          labCapacities.set(lab.id, available)
        }
      }

      // Run allocation algorithm
      const allocator = new LabRotationAllocator()
      const { assignments, stats } = allocator.allocate(applications, labCapacities)

      // Try to optimize assignments
      const improvements = allocator.optimizeAssignments(applications)
      if (improvements > 0) {
        // Re-get assignments after optimization
        const optimized = allocator.allocate(applications, labCapacities)
        Object.assign(assignments, optimized.assignments)
        Object.assign(stats, optimized.stats)
      }

      // If dry run, just return stats
      if (input.dryRun) {
        return {
          success: true,
          message: `模拟分配完成：${stats.assigned}/${stats.totalApplications} 学生成功分配`,
          data: { stats, improvements, dryRun: true }
        }
      }

      // Update applications with allocation results
      await ctx.prisma.$transaction([
        // Update assigned students
        ...assignments.map(assignment =>
          ctx.prisma.labRotationApplication.update({
            where: {
              studentId_semester: {
                studentId: assignment.studentId,
                semester: input.semester
              }
            },
            data: {
              status: RotationStatus.ASSIGNED,
              assignedLabId: assignment.labId,
              startDate: new Date(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
            }
          })
        )
      ])

      return {
        success: true,
        message: `分配完成：${stats.assigned}/${stats.totalApplications} 学生成功分配`,
        data: { stats, improvements }
      }
    }),

  // Start rotation (student confirms)
  startRotation: protectedProcedure
    .input(
      z.object({
        semester: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.labRotationApplication.findUnique({
        where: {
          studentId_semester: {
            studentId: ctx.session.user.id,
            semester: input.semester
          }
        }
      })

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '未找到轮转申请'
        })
      }

      if (application.status !== RotationStatus.ASSIGNED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '当前状态无法开始轮转'
        })
      }

      const updated = await ctx.prisma.labRotationApplication.update({
        where: {
          studentId_semester: {
            studentId: ctx.session.user.id,
            semester: input.semester
          }
        },
        data: {
          status: RotationStatus.IN_PROGRESS
        }
      })

      return {
        success: true,
        message: '实验室轮转已开始',
        data: updated
      }
    }),

  // Complete rotation (professor)
  completeRotation: professorProcedure
    .input(
      z.object({
        rotationId: z.string(),
        evaluation: z.string().min(50, '评价内容至少50字')
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify professor has access
      const rotation = await ctx.prisma.labRotationApplication.findFirst({
        where: {
          id: input.rotationId,
          status: RotationStatus.IN_PROGRESS,
          OR: [
            { assignedMentorId: ctx.session.user.id },
            { assignedLab: { directorId: ctx.session.user.id } }
          ]
        }
      })

      if (!rotation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权完成此轮转'
        })
      }

      // Update rotation status and add final evaluation
      const updated = await ctx.prisma.labRotationApplication.update({
        where: { id: input.rotationId },
        data: {
          status: RotationStatus.COMPLETED,
          endDate: new Date()
        }
      })

      // Could add a final evaluation model here

      return {
        success: true,
        message: '轮转已完成',
        data: updated
      }
    }),

  // Get allocation statistics
  getAllocationStats: adminProcedure
    .input(
      z.object({
        semester: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const stats = await ctx.prisma.labRotationApplication.groupBy({
        by: ['status'],
        where: { semester: input.semester },
        _count: true
      })

      const statusCounts = Object.fromEntries(
        stats.map(s => [s.status, s._count])
      )

      // Get lab distribution
      const labDistribution = await ctx.prisma.lab.findMany({
        include: {
          _count: {
            select: {
              rotations: {
                where: {
                  semester: input.semester,
                  status: { in: [RotationStatus.ASSIGNED, RotationStatus.IN_PROGRESS] }
                }
              }
            }
          }
        }
      })

      const labStats = labDistribution.map(lab => ({
        labId: lab.id,
        labName: lab.name,
        capacity: lab.capacity,
        assigned: lab._count.rotations,
        utilization: (lab._count.rotations / lab.capacity) * 100
      }))

      return {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        ...statusCounts,
        labStats
      }
    })
})