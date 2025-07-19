import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { AchievementType } from '@prisma/client'
import { 
  EvaluationCalculator, 
  type EvaluationData, 
  type MoralData,
  type AcademicData,
  type InnovationData,
  type ResearchData 
} from '@/lib/services/evaluation-calculator'

export const evaluationRouter = createTRPCRouter({
  // Get evaluations for current user
  getMyEvaluations: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
        semester: z.number().min(1).max(2).optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        studentId: ctx.session.user.id
      }
      
      if (input.year) {
        where.year = input.year
      }
      if (input.semester) {
        where.semester = input.semester
      }
      
      const evaluations = await ctx.prisma.evaluation.findMany({
        where,
        orderBy: [
          { year: 'desc' },
          { semester: 'desc' }
        ]
      })
      
      return evaluations
    }),

  // Get evaluation details
  getEvaluation: protectedProcedure
    .input(
      z.object({
        id: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const evaluation = await ctx.prisma.evaluation.findUnique({
        where: { id: input.id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              studentId: true
            }
          }
        }
      })
      
      if (!evaluation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '评价记录不存在'
        })
      }
      
      // Check access
      const user = ctx.session.user
      const hasAccess = 
        evaluation.studentId === user.id ||
        user.roles.includes('PROFESSOR') ||
        user.roles.includes('ADMIN') ||
        user.roles.includes('SECRETARY')
      
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此评价'
        })
      }
      
      return evaluation
    }),

  // Calculate evaluation for a student
  calculateEvaluation: professorProcedure
    .input(
      z.object({
        studentId: z.string(),
        year: z.number(),
        semester: z.number().min(1).max(2),
        moralData: z.object({
          base: z.number().min(0).max(100).default(60),
          additions: z.array(z.object({
            item: z.string(),
            score: z.number(),
            proof: z.string()
          })),
          deductions: z.array(z.object({
            item: z.string(),
            score: z.number(),
            reason: z.string()
          }))
        }),
        academicData: z.object({
          gpa: z.number().min(0),
          maxGpa: z.number().min(0),
          coreCourseAvg: z.number().min(0).max(100),
          activityCount: z.number().min(0)
        }),
        researchData: z.object({
          progressScore: z.number().min(0).max(100),
          logQuality: z.number().min(0).max(100),
          mentorScore: z.number().min(0).max(100),
          milestoneCompletion: z.number().min(0).max(100)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get student's achievements for innovation score
      const achievements = await ctx.prisma.achievement.findMany({
        where: {
          studentId: input.studentId,
          verified: true,
          createdAt: {
            gte: new Date(input.year, (input.semester - 1) * 6, 1),
            lt: new Date(input.year, input.semester * 6, 1)
          }
        }
      })
      
      // Convert achievements to innovation data
      const innovationData = EvaluationCalculator.achievementsToInnovationData(achievements)
      
      // Calculate evaluation
      const calculator = new EvaluationCalculator()
      const evaluationData: EvaluationData = {
        moral: input.moralData,
        academic: input.academicData,
        innovation: innovationData as InnovationData,
        research: input.researchData
      }
      
      const result = calculator.calculate(evaluationData)
      
      // Check if evaluation already exists
      const existing = await ctx.prisma.evaluation.findUnique({
        where: {
          studentId_year_semester: {
            studentId: input.studentId,
            year: input.year,
            semester: input.semester
          }
        }
      })
      
      // Save or update evaluation
      const evaluation = await ctx.prisma.evaluation.upsert({
        where: {
          studentId_year_semester: {
            studentId: input.studentId,
            year: input.year,
            semester: input.semester
          }
        },
        update: {
          moralScore: result.moral,
          academicScore: result.academic,
          innovationScore: result.innovation,
          researchScore: result.research,
          totalScore: result.total,
          rank: result.rank,
          evaluatorId: ctx.session.user.id,
          evaluationData: evaluationData as any,
          evaluationDetails: result.details
        },
        create: {
          studentId: input.studentId,
          year: input.year,
          semester: input.semester,
          moralScore: result.moral,
          academicScore: result.academic,
          innovationScore: result.innovation,
          researchScore: result.research,
          totalScore: result.total,
          rank: result.rank,
          evaluatorId: ctx.session.user.id,
          evaluationData: evaluationData as any,
          evaluationDetails: result.details
        }
      })
      
      return {
        success: true,
        message: existing ? '评价已更新' : '评价已创建',
        data: evaluation
      }
    }),

  // Quick evaluation based on available data
  quickEvaluate: professorProcedure
    .input(
      z.object({
        studentId: z.string(),
        year: z.number(),
        semester: z.number().min(1).max(2)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get student data
      const student = await ctx.prisma.user.findUnique({
        where: { id: input.studentId },
        include: {
          studentProjects: {
            where: { status: 'ACTIVE' },
            include: {
              projectMilestones: true,
              researchLogs: {
                where: {
                  createdAt: {
                    gte: new Date(input.year, (input.semester - 1) * 6, 1),
                    lt: new Date(input.year, input.semester * 6, 1)
                  }
                }
              }
            }
          },
          studentAchievements: {
            where: {
              verified: true,
              createdAt: {
                gte: new Date(input.year, (input.semester - 1) * 6, 1),
                lt: new Date(input.year, input.semester * 6, 1)
              }
            }
          }
        }
      })
      
      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '学生不存在'
        })
      }
      
      // Auto-generate evaluation data
      const project = student.studentProjects[0]
      const milestones = project?.projectMilestones || []
      const logs = project?.researchLogs || []
      
      // Calculate milestone completion
      const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length
      const milestoneCompletion = milestones.length > 0 
        ? (completedMilestones / milestones.length) * 100 
        : 0
      
      // Calculate log quality (based on frequency and length)
      const avgLogLength = logs.length > 0
        ? logs.reduce((sum, log) => sum + log.content.length, 0) / logs.length
        : 0
      const logFrequency = logs.length / 16 // Assume 16 weeks per semester
      const logQuality = Math.min(100, (avgLogLength / 200) * 50 + logFrequency * 50)
      
      // Default evaluation data
      const evaluationData: EvaluationData = {
        moral: {
          base: 80,
          additions: [],
          deductions: []
        },
        academic: {
          gpa: 3.5,
          maxGpa: 4.0,
          coreCourseAvg: 85,
          activityCount: 2
        },
        innovation: EvaluationCalculator.achievementsToInnovationData(student.studentAchievements) as InnovationData,
        research: {
          progressScore: Math.min(100, milestoneCompletion * 1.2),
          logQuality,
          mentorScore: 85,
          milestoneCompletion
        }
      }
      
      // Calculate and save
      const calculator = new EvaluationCalculator()
      const result = calculator.calculate(evaluationData)
      
      const evaluation = await ctx.prisma.evaluation.upsert({
        where: {
          studentId_year_semester: {
            studentId: input.studentId,
            year: input.year,
            semester: input.semester
          }
        },
        update: {
          moralScore: result.moral,
          academicScore: result.academic,
          innovationScore: result.innovation,
          researchScore: result.research,
          totalScore: result.total,
          rank: result.rank,
          evaluatorId: ctx.session.user.id,
          evaluationData: evaluationData as any,
          evaluationDetails: result.details
        },
        create: {
          studentId: input.studentId,
          year: input.year,
          semester: input.semester,
          moralScore: result.moral,
          academicScore: result.academic,
          innovationScore: result.innovation,
          researchScore: result.research,
          totalScore: result.total,
          rank: result.rank,
          evaluatorId: ctx.session.user.id,
          evaluationData: evaluationData as any,
          evaluationDetails: result.details
        }
      })
      
      return {
        success: true,
        message: '快速评价完成',
        data: evaluation
      }
    }),

  // Get evaluation ranking
  getRanking: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        semester: z.number().min(1).max(2),
        department: z.string().optional(),
        topN: z.number().default(100)
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        year: input.year,
        semester: input.semester
      }
      
      if (input.department) {
        where.student = {
          department: input.department
        }
      }
      
      const evaluations = await ctx.prisma.evaluation.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              studentId: true,
              department: true
            }
          }
        },
        orderBy: {
          totalScore: 'desc'
        },
        take: input.topN
      })
      
      // Add ranking position
      return evaluations.map((evaluation, index) => ({
        ...evaluation,
        rankPosition: index + 1
      }))
    }),

  // Get evaluation statistics
  getStatistics: adminProcedure
    .input(
      z.object({
        year: z.number(),
        semester: z.number().min(1).max(2)
      })
    )
    .query(async ({ ctx, input }) => {
      const evaluations = await ctx.prisma.evaluation.findMany({
        where: {
          year: input.year,
          semester: input.semester
        }
      })
      
      if (evaluations.length === 0) {
        return {
          total: 0,
          averages: { moral: 0, academic: 0, innovation: 0, research: 0, total: 0 },
          distribution: { A: 0, B: 0, C: 0, D: 0 }
        }
      }
      
      // Calculate averages
      const sums = evaluations.reduce(
        (acc, evaluation) => ({
          moral: acc.moral + evaluation.moralScore,
          academic: acc.academic + evaluation.academicScore,
          innovation: acc.innovation + evaluation.innovationScore,
          research: acc.research + evaluation.researchScore,
          total: acc.total + evaluation.totalScore
        }),
        { moral: 0, academic: 0, innovation: 0, research: 0, total: 0 }
      )
      
      const count = evaluations.length
      const averages = {
        moral: sums.moral / count,
        academic: sums.academic / count,
        innovation: sums.innovation / count,
        research: sums.research / count,
        total: sums.total / count
      }
      
      // Calculate rank distribution
      const distribution = evaluations.reduce(
        (acc, evaluation) => {
          acc[evaluation.rank]++
          return acc
        },
        { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>
      )
      
      // Department statistics
      const evaluationsWithDept = await ctx.prisma.evaluation.findMany({
        where: {
          year: input.year,
          semester: input.semester
        },
        include: {
          student: {
            select: {
              department: true
            }
          }
        }
      })
      
      // Group by department manually
      const deptGroups = evaluationsWithDept.reduce((acc, evaluation) => {
        const dept = evaluation.student.department || 'Unknown'
        if (!acc[dept]) {
          acc[dept] = { sum: 0, count: 0 }
        }
        acc[dept].sum += evaluation.totalScore
        acc[dept].count++
        return acc
      }, {} as Record<string, { sum: number, count: number }>)
      
      const departmentStats = Object.entries(deptGroups).map(([dept, stats]) => ({
        department: dept,
        avgScore: stats.sum / stats.count,
        count: stats.count
      }))
      
      return {
        total: count,
        averages,
        distribution,
        departmentStats
      }
    }),

  // Batch evaluate students
  batchEvaluate: adminProcedure
    .input(
      z.object({
        year: z.number(),
        semester: z.number().min(1).max(2),
        studentIds: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get students to evaluate
      const where: any = {
        roles: {
          some: { role: 'STUDENT' }
        }
      }
      
      if (input.studentIds && input.studentIds.length > 0) {
        where.id = { in: input.studentIds }
      }
      
      const students = await ctx.prisma.user.findMany({
        where,
        select: { id: true }
      })
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      // Process each student
      for (const student of students) {
        try {
          await ctx.trpc.evaluation.quickEvaluate.mutate({
            studentId: student.id,
            year: input.year,
            semester: input.semester
          })
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`Failed to evaluate student ${student.id}: ${error}`)
        }
      }
      
      return {
        success: true,
        message: `批量评价完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
        data: {
          successCount,
          errorCount,
          errors: errors.slice(0, 10) // Return first 10 errors
        }
      }
    }),

  // Export evaluations
  exportEvaluations: adminProcedure
    .input(
      z.object({
        year: z.number(),
        semester: z.number().min(1).max(2),
        format: z.enum(['json', 'csv']).default('json')
      })
    )
    .query(async ({ ctx, input }) => {
      const evaluations = await ctx.prisma.evaluation.findMany({
        where: {
          year: input.year,
          semester: input.semester
        },
        include: {
          student: {
            select: {
              name: true,
              nameEn: true,
              studentId: true,
              department: true
            }
          },
          evaluator: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          totalScore: 'desc'
        }
      })
      
      if (input.format === 'csv') {
        // Transform to CSV format
        const headers = [
          '排名', '学号', '姓名', '院系', 
          '思想品德', '学业成绩', '科技创新', '科研推进', 
          '总分', '等级', '评价人'
        ]
        
        const rows = evaluations.map((evaluation, index) => [
          index + 1,
          evaluation.student.studentId,
          evaluation.student.name,
          evaluation.student.department || '',
          evaluation.moralScore.toFixed(2),
          evaluation.academicScore.toFixed(2),
          evaluation.innovationScore.toFixed(2),
          evaluation.researchScore.toFixed(2),
          evaluation.totalScore.toFixed(2),
          evaluation.rank,
          evaluation.evaluator.name
        ])
        
        return {
          headers,
          rows,
          format: 'csv'
        }
      }
      
      return {
        data: evaluations,
        format: 'json'
      }
    }),
})