import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure } from '@/server/api/trpc'
import { TopicStatus, Difficulty } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const topicRouter = createTRPCRouter({
  // Create new topic (professors only)
  create: professorProcedure
    .input(
      z.object({
        title: z.string().min(5, '标题至少5个字符'),
        titleEn: z.string().optional(),
        description: z.string().min(50, '描述至少50个字符'),
        descriptionEn: z.string().optional(),
        maxStudents: z.number().min(1).max(10).default(1),
        prerequisites: z.array(z.string()),
        expectedOutcomes: z.array(z.string()),
        field: z.string(),
        difficulty: z.nativeEnum(Difficulty),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.create({
        data: {
          ...input,
          professorId: ctx.session.user.id,
          status: TopicStatus.RECRUITING,
        },
      })

      return {
        success: true,
        message: '课题创建成功',
        topic,
      }
    }),

  // Update topic
  update: professorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(5).optional(),
        titleEn: z.string().optional(),
        description: z.string().min(50).optional(),
        descriptionEn: z.string().optional(),
        maxStudents: z.number().min(1).max(10).optional(),
        prerequisites: z.array(z.string()).optional(),
        expectedOutcomes: z.array(z.string()).optional(),
        field: z.string().optional(),
        difficulty: z.nativeEnum(Difficulty).optional(),
        status: z.nativeEnum(TopicStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if user owns the topic
      const topic = await ctx.prisma.topic.findUnique({
        where: { id },
      })

      if (!topic || topic.professorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权修改此课题',
        })
      }

      const updated = await ctx.prisma.topic.update({
        where: { id },
        data,
      })

      return {
        success: true,
        message: '课题更新成功',
        topic: updated,
      }
    }),

  // Get all topics
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        status: z.nativeEnum(TopicStatus).optional(),
        field: z.string().optional(),
        difficulty: z.nativeEnum(Difficulty).optional(),
        professorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, ...filters } = input
      const skip = (page - 1) * limit

      const where = {
        ...filters,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      }

      const [topics, total] = await Promise.all([
        ctx.prisma.topic.findMany({
          where,
          skip,
          take: limit,
          include: {
            professor: true,
            _count: {
              select: {
                applications: true,
                projects: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.topic.count({ where }),
      ])

      return {
        topics,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    }),

  // Get topic by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.id },
        include: {
          professor: true,
          applications: {
            include: {
              student: true,
            },
          },
          projects: {
            include: {
              student: true,
            },
          },
        },
      })

      if (!topic) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '课题不存在',
        })
      }

      return topic
    }),

  // Get recommended topics for student
  getRecommended: protectedProcedure.query(async ({ ctx }) => {
    // For now, return recruiting topics ordered by creation date
    // In the future, implement smart matching based on student profile
    const topics = await ctx.prisma.topic.findMany({
      where: {
        status: TopicStatus.RECRUITING,
        currentStudents: {
          lt: ctx.prisma.topic.fields.maxStudents,
        },
      },
      include: {
        professor: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return topics
  }),

  // Get professor's topics
  getMyTopics: professorProcedure
    .input(
      z.object({
        status: z.nativeEnum(TopicStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const topics = await ctx.prisma.topic.findMany({
        where: {
          professorId: ctx.session.user.id,
          status: input.status,
        },
        include: {
          _count: {
            select: {
              applications: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return topics
    }),

  // Delete topic (only if no applications/projects)
  delete: professorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              applications: true,
              projects: true,
            },
          },
        },
      })

      if (!topic || topic.professorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权删除此课题',
        })
      }

      if (topic._count.applications > 0 || topic._count.projects > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '课题已有申请或项目，无法删除',
        })
      }

      await ctx.prisma.topic.delete({
        where: { id: input.id },
      })

      return {
        success: true,
        message: '课题删除成功',
      }
    }),
})