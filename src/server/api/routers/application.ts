import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { ApplicationStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const applicationRouter = createTRPCRouter({
  // Apply to a topic
  create: protectedProcedure
    .input(
      z.object({
        topicId: z.string(),
        resume: z.string().min(50, '简历至少50个字符'),
        resumeUrl: z.string().optional(),
        statement: z.string().min(100, '个人陈述至少100个字符'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if student already applied
      const existing = await ctx.prisma.application.findUnique({
        where: {
          studentId_topicId: {
            studentId: ctx.session.user.id,
            topicId: input.topicId,
          },
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '您已经申请过该课题',
        })
      }

      // Check if topic is recruiting
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
      })

      if (!topic || topic.status !== 'RECRUITING') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '该课题暂不接受申请',
        })
      }

      const application = await ctx.prisma.application.create({
        data: {
          ...input,
          studentId: ctx.session.user.id,
        },
      })

      return {
        success: true,
        message: '申请提交成功',
        application,
      }
    }),

  // Get student's applications
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.prisma.application.findMany({
      where: { studentId: ctx.session.user.id },
      include: {
        topic: {
          include: {
            professor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return applications
  }),

  // Get applications for professor's topics
  getForProfessor: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.prisma.application.findMany({
      where: {
        topic: {
          professorId: ctx.session.user.id,
        },
      },
      include: {
        student: true,
        topic: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return applications
  }),

  // Update application status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ApplicationStatus),
        reviewNotes: z.string().optional(),
        professorNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if user owns the topic
      const application = await ctx.prisma.application.findUnique({
        where: { id },
        include: {
          topic: true,
        },
      })

      if (!application || application.topic.professorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权处理此申请',
        })
      }

      const updated = await ctx.prisma.application.update({
        where: { id },
        data: {
          ...data,
          reviewedAt: data.status !== application.status ? new Date() : undefined,
        },
      })

      // If accepted, create project
      if (data.status === 'ACCEPTED') {
        await ctx.prisma.project.create({
          data: {
            studentId: application.studentId,
            advisorId: ctx.session.user.id,
            topicId: application.topicId,
            status: 'ACTIVE',
          },
        })

        // Update topic current students
        await ctx.prisma.topic.update({
          where: { id: application.topicId },
          data: {
            currentStudents: {
              increment: 1,
            },
          },
        })
      }

      return {
        success: true,
        message: '申请状态更新成功',
        application: updated,
      }
    }),
})