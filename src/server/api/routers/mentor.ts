import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { MentorApplicationStatus } from '@prisma/client'
import { GaleShapleyMatcher } from '@/lib/algorithms/gale-shapley'

const mentorApplicationSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, '学年格式应为YYYY-YYYY'),
  firstChoiceId: z.string().min(1, '请选择第一志愿导师'),
  firstReason: z.string().min(50, '第一志愿理由至少50字'),
  secondChoiceId: z.string().min(1, '请选择第二志愿导师'),
  secondReason: z.string().min(50, '第二志愿理由至少50字'),
  thirdChoiceId: z.string().optional(),
  thirdReason: z.string().optional(),
  personalStatement: z.string().min(100, '个人陈述至少100字'),
  researchInterest: z.string().min(20, '研究兴趣至少20字'),
})

export const mentorRouter = createTRPCRouter({
  // Get list of available mentors
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        department: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit

      const where = {
        roles: {
          some: {
            role: 'PROFESSOR' as const
          }
        },
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { nameEn: { contains: input.search, mode: 'insensitive' as const } },
            { department: { contains: input.search, mode: 'insensitive' as const } },
          ]
        }),
        ...(input.department && {
          department: input.department
        })
      }

      const [mentors, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            nameEn: true,
            email: true,
            department: true,
            maxStudents: true,
            // Count current students
            _count: {
              select: {
                finalMentorApplications: {
                  where: {
                    status: MentorApplicationStatus.CONFIRMED,
                    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
                  }
                }
              }
            }
          },
          skip,
          take: input.limit,
          orderBy: { name: 'asc' }
        }),
        ctx.prisma.user.count({ where })
      ])

      // Transform to include available slots
      const mentorsWithSlots = mentors.map(mentor => ({
        ...mentor,
        currentStudents: mentor._count.finalMentorApplications,
        availableSlots: (mentor.maxStudents || 3) - mentor._count.finalMentorApplications
      }))

      return {
        mentors: mentorsWithSlots,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      }
    }),

  // Get mentor details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const mentor = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          professorTopics: {
            where: { status: 'RECRUITING' },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              professorTopics: true,
              advisorProjects: {
                where: { status: 'ACTIVE' }
              },
              finalMentorApplications: {
                where: {
                  status: MentorApplicationStatus.CONFIRMED,
                  academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
                }
              }
            }
          }
        }
      })

      if (!mentor || !mentor.roles.some(r => r.role === 'PROFESSOR')) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '导师不存在'
        })
      }

      return mentor
    }),

  // Submit mentor application
  apply: protectedProcedure
    .input(mentorApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is a student
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { roles: true }
      })

      if (!user?.roles.some(r => r.role === 'STUDENT')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有学生可以申请导师'
        })
      }

      // Check for existing application
      const existing = await ctx.prisma.mentorApplication.findUnique({
        where: {
          studentId_academicYear: {
            studentId: ctx.session.user.id,
            academicYear: input.academicYear
          }
        }
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '您已经提交过本学年的导师申请'
        })
      }

      // Validate mentor choices are different
      const choices = [input.firstChoiceId, input.secondChoiceId, input.thirdChoiceId].filter(Boolean)
      if (new Set(choices).size !== choices.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '不能重复选择同一位导师'
        })
      }

      // Validate mentors exist
      const mentorIds = choices
      const mentors = await ctx.prisma.user.findMany({
        where: {
          id: { in: mentorIds },
          roles: { some: { role: 'PROFESSOR' } }
        }
      })

      if (mentors.length !== mentorIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '选择的导师无效'
        })
      }

      // Create application
      const application = await ctx.prisma.mentorApplication.create({
        data: {
          ...input,
          studentId: ctx.session.user.id,
          status: MentorApplicationStatus.PENDING
        },
        include: {
          student: true,
          firstChoice: true,
          secondChoice: true,
          thirdChoice: true
        }
      })

      return {
        success: true,
        message: '导师申请提交成功',
        data: application
      }
    }),

  // Get my application
  getMyApplication: protectedProcedure
    .input(
      z.object({
        academicYear: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const academicYear = input.academicYear || 
        `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

      const application = await ctx.prisma.mentorApplication.findUnique({
        where: {
          studentId_academicYear: {
            studentId: ctx.session.user.id,
            academicYear
          }
        },
        include: {
          firstChoice: true,
          secondChoice: true,
          thirdChoice: true,
          finalMentor: true
        }
      })

      return application
    }),

  // Get applications for a mentor
  getApplicationsForMentor: professorProcedure
    .input(
      z.object({
        academicYear: z.string().optional(),
        status: z.enum(['ALL', 'PENDING', 'MATCHED', 'CONFIRMED']).default('ALL')
      })
    )
    .query(async ({ ctx, input }) => {
      const academicYear = input.academicYear || 
        `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

      const applications = await ctx.prisma.mentorApplication.findMany({
        where: {
          academicYear,
          OR: [
            { firstChoiceId: ctx.session.user.id },
            { secondChoiceId: ctx.session.user.id },
            { thirdChoiceId: ctx.session.user.id },
            { finalMentorId: ctx.session.user.id }
          ],
          ...(input.status !== 'ALL' && {
            status: input.status as MentorApplicationStatus
          })
        },
        include: {
          student: {
            include: {
              studentAchievements: {
                where: { verified: true },
                take: 5,
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Add preference level for each application
      const applicationsWithPreference = applications.map(app => ({
        ...app,
        preferenceLevel: 
          app.firstChoiceId === ctx.session.user.id ? 1 :
          app.secondChoiceId === ctx.session.user.id ? 2 :
          app.thirdChoiceId === ctx.session.user.id ? 3 : 0
      }))

      return applicationsWithPreference
    }),

  // Run matching algorithm (admin only)
  runMatching: adminProcedure
    .input(
      z.object({
        academicYear: z.string(),
        dryRun: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all pending applications
      const applications = await ctx.prisma.mentorApplication.findMany({
        where: {
          academicYear: input.academicYear,
          status: MentorApplicationStatus.PENDING
        },
        include: {
          student: true
        }
      })

      if (applications.length === 0) {
        return {
          success: true,
          message: '没有待匹配的申请',
          data: { stats: null }
        }
      }

      // Get all mentors and their capacities
      const mentors = await ctx.prisma.user.findMany({
        where: {
          roles: { some: { role: 'PROFESSOR' } }
        },
        select: {
          id: true,
          maxStudents: true,
          _count: {
            select: {
              finalMentorApplications: {
                where: {
                  status: MentorApplicationStatus.CONFIRMED,
                  academicYear: input.academicYear
                }
              }
            }
          }
        }
      })

      // Calculate available capacity
      const mentorCapacities = new Map<string, number>()
      for (const mentor of mentors) {
        const maxStudents = mentor.maxStudents || 3
        const currentStudents = mentor._count.finalMentorApplications
        const available = maxStudents - currentStudents
        if (available > 0) {
          mentorCapacities.set(mentor.id, available)
        }
      }

      // Get student academic data for ranking
      const studentIds = applications.map(a => a.studentId)
      const evaluations = await ctx.prisma.evaluation.findMany({
        where: {
          studentId: { in: studentIds },
          year: new Date().getFullYear()
        },
        orderBy: { semester: 'desc' },
        distinct: ['studentId']
      })

      const studentData = new Map(
        evaluations.map(e => [
          e.studentId,
          {
            gpa: e.academicScore,
            researchScore: e.researchScore
          }
        ])
      )

      // Run matching algorithm
      const matcher = new GaleShapleyMatcher()
      const { matches, stats } = matcher.match(applications, mentorCapacities, studentData)

      // If dry run, just return stats
      if (input.dryRun) {
        return {
          success: true,
          message: `模拟匹配完成：${stats.matchedStudents}/${stats.totalStudents} 学生成功匹配`,
          data: { stats, dryRun: true }
        }
      }

      // Update applications with matching results
      await ctx.prisma.$transaction([
        // Update matched students
        ...matches.map(match =>
          ctx.prisma.mentorApplication.update({
            where: {
              studentId_academicYear: {
                studentId: match.studentId,
                academicYear: input.academicYear
              }
            },
            data: {
              status: match.matchRound === 1 
                ? MentorApplicationStatus.FIRST_MATCHED
                : match.matchRound === 2
                ? MentorApplicationStatus.SECOND_MATCHED
                : MentorApplicationStatus.THIRD_MATCHED,
              finalMentorId: match.mentorId,
              matchRound: match.matchRound
            }
          })
        ),
        // Update unmatched students
        ctx.prisma.mentorApplication.updateMany({
          where: {
            academicYear: input.academicYear,
            status: MentorApplicationStatus.PENDING,
            studentId: {
              notIn: matches.map(m => m.studentId)
            }
          },
          data: {
            status: MentorApplicationStatus.UNMATCHED
          }
        })
      ])

      return {
        success: true,
        message: `匹配完成：${stats.matchedStudents}/${stats.totalStudents} 学生成功匹配`,
        data: { stats }
      }
    }),

  // Confirm match (student action)
  confirmMatch: protectedProcedure
    .input(
      z.object({
        academicYear: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.mentorApplication.findUnique({
        where: {
          studentId_academicYear: {
            studentId: ctx.session.user.id,
            academicYear: input.academicYear
          }
        }
      })

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '未找到申请记录'
        })
      }

      if (!['FIRST_MATCHED', 'SECOND_MATCHED', 'THIRD_MATCHED'].includes(application.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '当前状态无法确认'
        })
      }

      const updated = await ctx.prisma.mentorApplication.update({
        where: {
          studentId_academicYear: {
            studentId: ctx.session.user.id,
            academicYear: input.academicYear
          }
        },
        data: {
          status: MentorApplicationStatus.CONFIRMED
        }
      })

      return {
        success: true,
        message: '已确认导师匹配结果',
        data: updated
      }
    }),

  // Get matching statistics
  getMatchingStats: adminProcedure
    .input(
      z.object({
        academicYear: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const stats = await ctx.prisma.mentorApplication.groupBy({
        by: ['status'],
        where: { academicYear: input.academicYear },
        _count: true
      })

      const statusCounts = Object.fromEntries(
        stats.map(s => [s.status, s._count])
      )

      // Get round distribution for matched students
      const matchedApplications = await ctx.prisma.mentorApplication.findMany({
        where: {
          academicYear: input.academicYear,
          matchRound: { not: null }
        },
        select: { matchRound: true }
      })

      const roundDistribution = matchedApplications.reduce((acc, app) => {
        const round = app.matchRound || 0
        acc[round] = (acc[round] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      return {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        ...statusCounts,
        roundDistribution
      }
    })
})