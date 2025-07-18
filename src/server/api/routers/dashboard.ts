import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { Role } from '@prisma/client'

export const dashboardRouter = createTRPCRouter({
  // Get dashboard stats based on user role
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const userRoles = ctx.session.user.roles

    if (userRoles.includes(Role.STUDENT)) {
      const [projects, achievements, applications] = await Promise.all([
        ctx.prisma.project.count({
          where: { studentId: userId, status: 'ACTIVE' },
        }),
        ctx.prisma.achievement.count({
          where: { studentId: userId },
        }),
        ctx.prisma.application.count({
          where: { studentId: userId },
        }),
      ])

      return {
        role: 'STUDENT',
        stats: {
          activeProjects: projects,
          totalAchievements: achievements,
          totalApplications: applications,
        },
      }
    }

    if (userRoles.includes(Role.PROFESSOR)) {
      const [topics, students, pendingReviews] = await Promise.all([
        ctx.prisma.topic.count({
          where: { professorId: userId },
        }),
        ctx.prisma.project.count({
          where: { advisorId: userId, status: 'ACTIVE' },
        }),
        ctx.prisma.application.count({
          where: {
            topic: { professorId: userId },
            status: 'PENDING',
          },
        }),
      ])

      return {
        role: 'PROFESSOR',
        stats: {
          totalTopics: topics,
          activeStudents: students,
          pendingReviews,
        },
      }
    }

    if (userRoles.includes(Role.SECRETARY)) {
      const [totalProjects, totalStudents, totalTopics] = await Promise.all([
        ctx.prisma.project.count({ where: { status: 'ACTIVE' } }),
        ctx.prisma.user.count({
          where: { roles: { some: { role: 'STUDENT' } } },
        }),
        ctx.prisma.topic.count({ where: { status: 'RECRUITING' } }),
      ])

      return {
        role: 'SECRETARY',
        stats: {
          totalProjects,
          totalStudents,
          recruitingTopics: totalTopics,
        },
      }
    }

    if (userRoles.includes(Role.ADMIN)) {
      const [users, topics, projects, achievements] = await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.topic.count(),
        ctx.prisma.project.count(),
        ctx.prisma.achievement.count(),
      ])

      return {
        role: 'ADMIN',
        stats: {
          totalUsers: users,
          totalTopics: topics,
          totalProjects: projects,
          totalAchievements: achievements,
        },
      }
    }

    return {
      role: 'UNKNOWN',
      stats: {},
    }
  }),

  // Get recent activities
  getRecentActivities: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const userRoles = ctx.session.user.roles

    if (userRoles.includes(Role.STUDENT)) {
      const progress = await ctx.prisma.progress.findMany({
        where: { studentId: userId },
        include: {
          project: {
            include: { topic: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      return progress.map((p) => ({
        id: p.id,
        type: 'progress',
        title: p.title,
        description: `${p.project.topic.title} - ${p.type}`,
        date: p.createdAt,
      }))
    }

    if (userRoles.includes(Role.PROFESSOR)) {
      const applications = await ctx.prisma.application.findMany({
        where: {
          topic: { professorId: userId },
        },
        include: {
          student: true,
          topic: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      return applications.map((a) => ({
        id: a.id,
        type: 'application',
        title: `${a.student.name} 申请了 ${a.topic.title}`,
        description: a.statement.substring(0, 100) + '...',
        date: a.createdAt,
      }))
    }

    return []
  }),
})