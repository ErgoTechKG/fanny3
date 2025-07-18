import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const authRouter = createTRPCRouter({
  // Get current user
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  // Register new user (students only for now)
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('请输入有效的邮箱地址'),
        password: z.string().min(6, '密码至少6个字符'),
        name: z.string().min(2, '姓名至少2个字符'),
        studentId: z.string().min(6, '学号至少6个字符'),
        department: z.string().min(2, '请选择院系'),
        phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { email: input.email },
            { studentId: input.studentId },
          ],
        },
      })

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: exists.email === input.email ? '邮箱已被注册' : '学号已被注册',
        })
      }

      const hashedPassword = await bcrypt.hash(input.password, 10)

      const user = await ctx.prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
          roles: {
            create: {
              role: 'STUDENT',
            },
          },
        },
        include: {
          roles: true,
        },
      })

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        message: '注册成功',
      }
    }),

  // Get user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        roles: true,
        studentProjects: {
          include: {
            topic: true,
            advisor: true,
          },
        },
        professorTopics: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        studentAchievements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '用户不存在',
      })
    }

    return user
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        nameEn: z.string().optional(),
        phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
        department: z.string().optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })

      return {
        success: true,
        message: '个人信息更新成功',
        user,
      }
    }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, '新密码至少6个字符'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户不存在',
        })
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password)
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '当前密码错误',
        })
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10)
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      })

      return {
        success: true,
        message: '密码修改成功',
      }
    }),
})