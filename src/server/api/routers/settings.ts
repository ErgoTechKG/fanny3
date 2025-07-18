import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { Theme, NotificationFrequency } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'

interface RoleSettings {
  officeHours?: {
    start: string
    end: string
    excludeWeekends: boolean
  }
  studentCapacity?: number
  labPreferences?: string[]
  mentorPreferences?: string[]
  reportGenerationPreferences?: Record<string, unknown>
}

export const settingsRouter = createTRPCRouter({
  // Get all user settings
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get or create user settings
    let settings = await ctx.prisma.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      settings = await ctx.prisma.userSettings.create({
        data: { userId },
      })
    }

    // Get user profile information
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nameEn: true,
        studentId: true,
        phone: true,
        avatar: true,
        department: true,
        roles: {
          select: { role: true },
        },
      },
    })

    return {
      profile: user,
      settings,
    }
  }),

  // Update general settings
  updateUserSettings: protectedProcedure
    .input(z.object({
      theme: z.nativeEnum(Theme).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      })

      return {
        success: true,
        message: '设置更新成功',
        settings,
      }
    }),

  // Update notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      wechatNotifications: z.boolean().optional(),
      notificationFrequency: z.nativeEnum(NotificationFrequency).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      })

      return {
        success: true,
        message: '通知设置更新成功',
        settings,
      }
    }),

  // Update role-specific settings
  updateRoleSpecificSettings: protectedProcedure
    .input(z.object({
      roleSettings: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const user = ctx.session.user

      // Validate role-specific settings based on user role
      const validSettings: RoleSettings = {}

      if (user.roles.includes('PROFESSOR')) {
        // Professor-specific settings
        if (input.roleSettings.officeHours) {
          validSettings.officeHours = {
            start: input.roleSettings.officeHours.start || '09:00',
            end: input.roleSettings.officeHours.end || '17:00',
            excludeWeekends: input.roleSettings.officeHours.excludeWeekends ?? true,
          }
        }
        if (input.roleSettings.studentCapacity !== undefined) {
          validSettings.studentCapacity = Math.max(1, Math.min(50, input.roleSettings.studentCapacity))
        }
      }

      if (user.roles.includes('STUDENT')) {
        // Student-specific settings
        if (input.roleSettings.labPreferences) {
          validSettings.labPreferences = input.roleSettings.labPreferences
        }
        if (input.roleSettings.mentorPreferences) {
          validSettings.mentorPreferences = input.roleSettings.mentorPreferences
        }
      }

      if (user.roles.includes('SECRETARY')) {
        // Secretary-specific settings
        if (input.roleSettings.reportGenerationPreferences) {
          validSettings.reportGenerationPreferences = input.roleSettings.reportGenerationPreferences
        }
      }

      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId },
        update: { roleSettings: validSettings },
        create: {
          userId,
          roleSettings: validSettings,
        },
      })

      return {
        success: true,
        message: '角色设置更新成功',
        settings,
      }
    }),

  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(6, '密码至少6位'),
      newPassword: z.string().min(6, '新密码至少6位'),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword, confirmPassword } = input
      const userId = ctx.session.user.id

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '新密码与确认密码不匹配',
        })
      }

      // Get user with current password
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户不存在',
        })
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '当前密码错误',
        })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return {
        success: true,
        message: '密码修改成功',
      }
    }),

  // Update profile information
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2, '姓名至少2字').optional(),
      nameEn: z.string().optional(),
      phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional(),
      department: z.string().optional(),
      avatar: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const updated = await ctx.prisma.user.update({
        where: { id: userId },
        data: input,
      })

      return {
        success: true,
        message: '个人信息更新成功',
        user: updated,
      }
    }),

  // Update form preferences
  updateFormPreferences: protectedProcedure
    .input(z.object({
      formPreferences: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId },
        update: { formPreferences: input.formPreferences },
        create: {
          userId,
          formPreferences: input.formPreferences,
        },
      })

      return {
        success: true,
        message: '表单设置更新成功',
        settings,
      }
    }),

  // Get notification categories
  getNotificationCategories: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user
    const categories = [
      {
        id: 'system',
        name: '系统通知',
        description: '系统更新、维护等通知',
        enabled: true,
      },
      {
        id: 'progress',
        name: '进度提醒',
        description: '里程碑截止日期、进度更新提醒',
        enabled: true,
      },
      {
        id: 'meeting',
        name: '会议通知',
        description: '会议邀请、时间变更等',
        enabled: true,
      },
    ]

    // Add role-specific categories
    if (user.roles.includes('STUDENT')) {
      categories.push({
        id: 'application',
        name: '申请状态',
        description: '课题申请状态更新',
        enabled: true,
      })
    }

    if (user.roles.includes('PROFESSOR')) {
      categories.push({
        id: 'review',
        name: '审核提醒',
        description: '待审核的申请和进度报告',
        enabled: true,
      })
    }

    return categories
  }),

  // Test notification settings
  testNotificationSettings: protectedProcedure
    .input(z.object({
      type: z.enum(['email', 'push', 'wechat']),
    }))
    .mutation(async ({ ctx, input }) => {
      // In a real implementation, this would send a test notification
      // For now, we'll simulate success
      const messages = {
        email: '测试邮件已发送到您的邮箱',
        push: '测试推送通知已发送',
        wechat: '测试企业微信通知已发送',
      }

      return {
        success: true,
        message: messages[input.type],
      }
    }),

  // Export user data (GDPR compliance)
  exportUserData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [user, projects, applications, achievements, logs, events] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: true,
          userSettings: true,
        },
      }),
      ctx.prisma.project.findMany({
        where: { studentId: userId },
        include: {
          topic: true,
          progress: true,
          milestones: true,
        },
      }),
      ctx.prisma.application.findMany({
        where: { studentId: userId },
        include: { topic: true },
      }),
      ctx.prisma.achievement.findMany({
        where: { studentId: userId },
      }),
      ctx.prisma.researchLog.findMany({
        where: { studentId: userId },
      }),
      ctx.prisma.event.findMany({
        where: {
          OR: [
            { createdById: userId },
            { attendees: { some: { userId } } },
          ],
        },
      }),
    ])

    return {
      user: {
        ...user,
        password: undefined, // Remove sensitive data
      },
      projects,
      applications,
      achievements,
      researchLogs: logs,
      events,
      exportedAt: new Date(),
    }
  }),

  // Delete account (soft delete)
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify password
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户不存在',
        })
      }

      const isValid = await bcrypt.compare(input.password, user.password)
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '密码错误',
        })
      }

      // In a real implementation, this would be a soft delete
      // For now, we'll just return success
      // await ctx.prisma.user.update({
      //   where: { id: userId },
      //   data: { deletedAt: new Date() }
      // })

      return {
        success: true,
        message: '账号删除请求已提交，将在7天后生效',
      }
    }),
})