import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure } from '@/server/api/trpc'
import { ApplicationStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const topicManagementRouter = createTRPCRouter({
  // Get topic with detailed application info for professors
  getTopicWithApplications: professorProcedure
    .input(
      z.object({
        topicId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
        include: {
          applications: {
            include: {
              student: {
                include: {
                  achievements: true,
                  projects: {
                    include: {
                      topic: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (!topic || topic.professorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此课题的申请',
        })
      }

      return topic
    }),

  // Batch update application statuses
  batchUpdateApplications: professorProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            applicationId: z.string(),
            status: z.nativeEnum(ApplicationStatus),
            professorNote: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify all applications belong to professor's topics
      const applicationIds = input.updates.map((u) => u.applicationId)
      const applications = await ctx.prisma.application.findMany({
        where: {
          id: { in: applicationIds },
        },
        include: {
          topic: true,
        },
      })

      const unauthorized = applications.find(
        (app) => app.topic.professorId !== ctx.session.user.id
      )
      if (unauthorized) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权处理部分申请',
        })
      }

      // Perform batch updates
      const results = await Promise.all(
        input.updates.map(async (update) => {
          const app = applications.find((a) => a.id === update.applicationId)
          if (!app) return null

          const updated = await ctx.prisma.application.update({
            where: { id: update.applicationId },
            data: {
              status: update.status,
              professorNote: update.professorNote,
              reviewedAt: new Date(),
            },
          })

          // Handle accepted applications
          if (update.status === 'ACCEPTED' && app.status !== 'ACCEPTED') {
            await ctx.prisma.project.create({
              data: {
                studentId: app.studentId,
                advisorId: ctx.session.user.id,
                topicId: app.topicId,
                status: 'ACTIVE',
              },
            })

            await ctx.prisma.topic.update({
              where: { id: app.topicId },
              data: {
                currentStudents: { increment: 1 },
              },
            })
          }

          return updated
        })
      )

      return {
        success: true,
        message: '批量更新成功',
        results: results.filter(Boolean),
      }
    }),

  // Student confirms/rejects accepted application
  confirmApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.application.findUnique({
        where: { id: input.applicationId },
        include: {
          topic: true,
        },
      })

      if (!application || application.studentId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权操作此申请',
        })
      }

      if (application.status !== 'ACCEPTED') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只能确认已通过的申请',
        })
      }

      if (input.confirm) {
        // Student confirms - project already created, just update status
        return {
          success: true,
          message: '已确认接受课题',
        }
      } else {
        // Student rejects - delete project and update application
        await ctx.prisma.project.deleteMany({
          where: {
            studentId: ctx.session.user.id,
            topicId: application.topicId,
          },
        })

        await ctx.prisma.topic.update({
          where: { id: application.topicId },
          data: {
            currentStudents: { decrement: 1 },
          },
        })

        await ctx.prisma.application.update({
          where: { id: input.applicationId },
          data: {
            status: 'WITHDRAWN',
          },
        })

        return {
          success: true,
          message: '已拒绝课题',
        }
      }
    }),

  // Get application statistics for a topic
  getTopicStats: professorProcedure
    .input(
      z.object({
        topicId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
      })

      if (!topic || topic.professorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此课题统计',
        })
      }

      const stats = await ctx.prisma.application.groupBy({
        by: ['status'],
        where: {
          topicId: input.topicId,
        },
        _count: true,
      })

      const formattedStats = {
        total: 0,
        pending: 0,
        reviewing: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      }

      stats.forEach((stat) => {
        formattedStats[stat.status.toLowerCase() as keyof typeof formattedStats] = stat._count
        formattedStats.total += stat._count
      })

      return formattedStats
    }),

  // Smart matching algorithm for topic recommendations
  getMatchedTopics: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get student's profile and history
      const student = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          studentApplications: {
            include: {
              topic: true,
            },
          },
          studentProjects: {
            include: {
              topic: true,
            },
          },
          studentAchievements: true,
        },
      })

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '学生信息不存在',
        })
      }

      // Extract fields from past applications and projects
      const appliedFields = new Set<string>()
      student.studentApplications.forEach((app) => {
        appliedFields.add(app.topic.field)
      })
      student.studentProjects.forEach((proj) => {
        appliedFields.add(proj.topic.field)
      })

      // Get recruiting topics, prioritizing fields student has shown interest in
      const topics = await ctx.prisma.topic.findMany({
        where: {
          status: 'RECRUITING',
          currentStudents: {
            lt: ctx.prisma.topic.fields.maxStudents,
          },
          // Exclude topics already applied to
          NOT: {
            applications: {
              some: {
                studentId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          professor: true,
          _count: {
            select: {
              applications: true,
              projects: true,
            },
          },
        },
        orderBy: [
          // Prioritize matching fields
          {
            field: appliedFields.size > 0 ? 'asc' : undefined,
          },
          // Then by creation date
          {
            createdAt: 'desc',
          },
        ],
        take: input.limit,
      })

      // Calculate match scores
      const scoredTopics = topics.map((topic) => {
        let score = 0

        // Field match
        if (appliedFields.has(topic.field)) {
          score += 30
        }

        // Difficulty match based on achievements
        const achievementCount = student.studentAchievements.length
        if (achievementCount > 5 && topic.difficulty === 'ADVANCED') {
          score += 20
        } else if (achievementCount > 2 && topic.difficulty === 'INTERMEDIATE') {
          score += 20
        } else if (achievementCount <= 2 && topic.difficulty === 'BEGINNER') {
          score += 20
        }

        // Popularity (fewer applications = higher score)
        const competitionRatio = topic._count.applications / topic.maxStudents
        if (competitionRatio < 0.5) {
          score += 10
        } else if (competitionRatio < 1) {
          score += 5
        }

        return {
          ...topic,
          matchScore: score,
        }
      })

      // Sort by match score
      scoredTopics.sort((a, b) => b.matchScore - a.matchScore)

      return scoredTopics
    }),
})