import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc'
import { Role } from '@prisma/client'

export const userRouter = createTRPCRouter({
  // Get all users (admin only)
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        role: z.nativeEnum(Role).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, role } = input
      const skip = (page - 1) * limit

      const where = {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { email: { contains: search, mode: 'insensitive' as const } },
                  { studentId: { contains: search, mode: 'insensitive' as const } },
                ],
              }
            : {},
          role
            ? {
                roles: {
                  some: { role },
                },
              }
            : {},
        ],
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            roles: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.user.count({ where }),
      ])

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          roles: true,
          studentProjects: {
            include: {
              topic: true,
              advisor: true,
            },
          },
          professorTopics: {
            include: {
              _count: {
                select: { applications: true },
              },
            },
          },
          studentAchievements: true,
        },
      })

      return user
    }),

  // Update user roles (admin only)
  updateRoles: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        roles: z.array(z.nativeEnum(Role)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete existing roles
      await ctx.prisma.userRole.deleteMany({
        where: { userId: input.userId },
      })

      // Create new roles
      await ctx.prisma.userRole.createMany({
        data: input.roles.map((role) => ({
          userId: input.userId,
          role,
        })),
      })

      return {
        success: true,
        message: '用户角色更新成功',
      }
    }),

  // Get professors
  getProfessors: protectedProcedure
    .input(
      z.object({
        department: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const professors = await ctx.prisma.user.findMany({
        where: {
          roles: {
            some: { role: 'PROFESSOR' },
          },
          department: input.department || undefined,
          name: input.search
            ? { contains: input.search, mode: 'insensitive' }
            : undefined,
        },
        include: {
          professorTopics: {
            where: { status: 'RECRUITING' },
            include: {
              _count: {
                select: { applications: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return professors
    }),

  // Get students
  getStudents: protectedProcedure
    .input(
      z.object({
        department: z.string().optional(),
        search: z.string().optional(),
        hasProject: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const students = await ctx.prisma.user.findMany({
        where: {
          roles: {
            some: { role: 'STUDENT' },
          },
          department: input.department || undefined,
          name: input.search
            ? { contains: input.search, mode: 'insensitive' }
            : undefined,
          studentProjects: input.hasProject
            ? { some: { status: 'ACTIVE' } }
            : undefined,
        },
        include: {
          studentProjects: {
            where: { status: 'ACTIVE' },
            include: {
              topic: true,
              advisor: true,
            },
          },
          studentAchievements: {
            where: { verified: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      return students
    }),

  // Delete user (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.delete({
        where: { id: input.id },
      })

      return {
        success: true,
        message: '用户删除成功',
      }
    }),
})