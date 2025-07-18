import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure } from '@/server/api/trpc'
import { LogType, MilestoneProgressStatus, AlertLevel, MilestoneType } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const progressRouter = createTRPCRouter({
  // Get user's projects for progress tracking
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user
    const isStudent = user.roles.includes('STUDENT')
    const isProfessor = user.roles.includes('PROFESSOR')

    if (isStudent) {
      return await ctx.prisma.project.findMany({
        where: { studentId: user.id },
        include: {
          topic: { select: { title: true, titleEn: true } },
          advisor: { select: { name: true, nameEn: true } },
        },
      })
    }

    if (isProfessor) {
      return await ctx.prisma.project.findMany({
        where: { advisorId: user.id },
        include: {
          topic: { select: { title: true, titleEn: true } },
          student: { select: { name: true, nameEn: true, studentId: true } },
        },
      })
    }

    // Secretary and Admin can see all projects
    return await ctx.prisma.project.findMany({
      include: {
        topic: { select: { title: true, titleEn: true } },
        student: { select: { name: true, nameEn: true, studentId: true } },
        advisor: { select: { name: true, nameEn: true } },
      },
    })
  }),

  // Get project progress overview with milestones
  getProjectProgress: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          topic: true,
          student: true,
          advisor: true,
          projectMilestones: {
            include: {
              feedback: {
                include: {
                  professor: { select: { name: true } },
                },
              },
            },
            orderBy: { dueDate: 'asc' },
          },
          researchLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '项目不存在',
        })
      }

      // Check access permissions
      const user = ctx.session.user
      const isStudent = user.roles.includes('STUDENT') && project.studentId === user.id
      const isProfessor = user.roles.includes('PROFESSOR') && project.advisorId === user.id
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SECRETARY')

      if (!isStudent && !isProfessor && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权访问此项目',
        })
      }

      return project
    }),

  // Get research logs
  getResearchLogs: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      type: z.nativeEnum(LogType).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { projectId, type, page, limit } = input
      const skip = (page - 1) * limit

      const where: { projectId: string; type?: LogType } = { projectId }
      if (type) where.type = type

      const [logs, total] = await Promise.all([
        ctx.prisma.researchLog.findMany({
          where,
          include: {
            student: { select: { name: true, studentId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.researchLog.count({ where }),
      ])

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    }),

  // Submit research log
  submitResearchLog: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(50, '日志内容至少50字'),
      type: z.nativeEnum(LogType),
      attachments: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is student on this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          studentId: ctx.session.user.id,
        },
      })

      if (!project) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权访问此项目',
        })
      }

      // Calculate week number for 4-week summaries
      let weekNumber: number | undefined
      if (input.type === LogType.SUMMARY) {
        const weeksSinceStart = Math.floor(
          (Date.now() - project.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        )
        weekNumber = Math.floor(weeksSinceStart / 4) + 1
      }

      const log = await ctx.prisma.researchLog.create({
        data: {
          ...input,
          studentId: ctx.session.user.id,
          weekNumber,
        },
      })

      return {
        success: true,
        message: '日志提交成功',
        log,
      }
    }),

  // Submit 4-week summary
  submit4WeekSummary: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(200, '小结内容至少200字'),
      attachments: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.trpc.progress.submitResearchLog.mutate({
        ...input,
        type: LogType.SUMMARY,
      })
    }),

  // Get project milestones
  getMilestones: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.projectMilestone.findMany({
        where: { projectId: input.projectId },
        include: {
          feedback: {
            include: {
              professor: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      })
    }),

  // Update milestone status
  updateMilestone: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(MilestoneProgressStatus),
      completedAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, completedAt } = input

      // Get milestone to check permissions
      const milestone = await ctx.prisma.projectMilestone.findUnique({
        where: { id },
        include: {
          project: true,
        },
      })

      if (!milestone) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '里程碑不存在',
        })
      }

      // Check permissions
      const user = ctx.session.user
      const isStudent = user.roles.includes('STUDENT') && milestone.project.studentId === user.id
      const isProfessor = user.roles.includes('PROFESSOR') && milestone.project.advisorId === user.id
      const isAdmin = user.roles.includes('ADMIN')

      if (!isStudent && !isProfessor && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权修改此里程碑',
        })
      }

      // Update alert level based on status and due date
      let alertLevel = AlertLevel.GREEN
      if (status === MilestoneProgressStatus.DELAYED || status === MilestoneProgressStatus.AT_RISK) {
        alertLevel = AlertLevel.RED
      } else if (new Date() > milestone.dueDate && status !== MilestoneProgressStatus.COMPLETED) {
        alertLevel = AlertLevel.YELLOW
      }

      const updated = await ctx.prisma.projectMilestone.update({
        where: { id },
        data: {
          status,
          alertLevel,
          completedAt: status === MilestoneProgressStatus.COMPLETED ? completedAt || new Date() : null,
        },
      })

      return {
        success: true,
        message: '里程碑状态更新成功',
        milestone: updated,
      }
    }),

  // Submit milestone feedback (professors only)
  submitMilestoneFeedback: professorProcedure
    .input(z.object({
      milestoneId: z.string(),
      content: z.string().min(10, '反馈内容至少10字'),
      approved: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.prisma.professorFeedback.create({
        data: {
          ...input,
          professorId: ctx.session.user.id,
        },
      })

      // If approved, update milestone status
      if (input.approved) {
        await ctx.prisma.projectMilestone.update({
          where: { id: input.milestoneId },
          data: {
            status: MilestoneProgressStatus.COMPLETED,
            alertLevel: AlertLevel.GREEN,
            completedAt: new Date(),
          },
        })
      }

      return {
        success: true,
        message: input.approved ? '里程碑已批准' : '反馈已提交',
        feedback,
      }
    }),

  // Get progress alerts
  getProgressAlerts: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      alertLevel: z.nativeEnum(AlertLevel).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: {
        projectId?: string
        alertLevel?: AlertLevel
        project?: { studentId?: string; advisorId?: string }
      } = {}
      if (input.projectId) where.projectId = input.projectId
      if (input.alertLevel) where.alertLevel = input.alertLevel

      // Add role-based filtering
      const user = ctx.session.user
      if (user.roles.includes('STUDENT')) {
        where.project = { studentId: user.id }
      } else if (user.roles.includes('PROFESSOR')) {
        where.project = { advisorId: user.id }
      }

      return await ctx.prisma.projectMilestone.findMany({
        where,
        include: {
          project: {
            include: {
              student: { select: { name: true, studentId: true } },
              topic: { select: { title: true } },
            },
          },
        },
        orderBy: [
          { alertLevel: 'desc' }, // RED first, then YELLOW, then GREEN
          { dueDate: 'asc' },
        ],
      })
    }),

  // Get progress statistics
  getProgressStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [
        totalMilestones,
        completedMilestones,
        delayedMilestones,
        totalLogs,
        recentLogs,
      ] = await Promise.all([
        ctx.prisma.projectMilestone.count({
          where: { projectId: input.projectId },
        }),
        ctx.prisma.projectMilestone.count({
          where: {
            projectId: input.projectId,
            status: MilestoneProgressStatus.COMPLETED,
          },
        }),
        ctx.prisma.projectMilestone.count({
          where: {
            projectId: input.projectId,
            status: { in: [MilestoneProgressStatus.DELAYED, MilestoneProgressStatus.AT_RISK] },
          },
        }),
        ctx.prisma.researchLog.count({
          where: { projectId: input.projectId },
        }),
        ctx.prisma.researchLog.count({
          where: {
            projectId: input.projectId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
        }),
      ])

      const progressPercentage = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0

      return {
        totalMilestones,
        completedMilestones,
        delayedMilestones,
        progressPercentage,
        totalLogs,
        recentLogs,
      }
    }),

  // Generate Gantt chart data
  generateGanttData: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.prisma.projectMilestone.findMany({
        where: { projectId: input.projectId },
        orderBy: { dueDate: 'asc' },
      })

      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { startDate: true, endDate: true },
      })

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '项目不存在',
        })
      }

      // Transform milestones to Gantt chart format
      const ganttData = milestones.map((milestone, index) => {
        const startDate = index === 0 
          ? project.startDate 
          : milestones[index - 1]?.dueDate || project.startDate
        
        return {
          id: milestone.id,
          name: milestone.name,
          start: startDate.toISOString(),
          end: milestone.dueDate.toISOString(),
          progress: milestone.status === MilestoneProgressStatus.COMPLETED ? 100 : 
                   milestone.status === MilestoneProgressStatus.IN_PROGRESS ? 50 : 0,
          status: milestone.status,
          alertLevel: milestone.alertLevel,
        }
      })

      return {
        projectStart: project.startDate,
        projectEnd: project.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year
        milestones: ganttData,
      }
    }),

  // Create milestone (professors/admins only)
  createMilestone: professorProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(2, '里程碑名称至少2字'),
      nameEn: z.string().optional(),
      type: z.nativeEnum(MilestoneType),
      dueDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify professor has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          advisorId: ctx.session.user.id,
        },
      })

      if (!project && !ctx.session.user.roles.includes('ADMIN')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权为此项目创建里程碑',
        })
      }

      const milestone = await ctx.prisma.projectMilestone.create({
        data: input,
      })

      return {
        success: true,
        message: '里程碑创建成功',
        milestone,
      }
    }),
})