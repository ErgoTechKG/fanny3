import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { FormStatus } from '@prisma/client'
import { FormEngine } from '@/lib/services/form-engine'
import { getFormTemplate, listFormTypes } from '@/lib/forms/templates'

export const formRouter = createTRPCRouter({
  // List available form types
  listFormTypes: protectedProcedure
    .query(async ({ ctx }) => {
      const formTypes = listFormTypes()
      
      // Filter based on user role
      const user = ctx.session.user
      const filteredTypes = formTypes.filter(formType => {
        // Students can fill student forms
        if (user.roles.includes('STUDENT') && 
            ['LAB_ROTATION_ASSESSMENT', 'SEMESTER_PROGRESS', 'ACHIEVEMENT_STATISTICS'].includes(formType.type)) {
          return true
        }
        
        // Professors can fill professor forms
        if (user.roles.includes('PROFESSOR') && 
            ['DAILY_GUIDANCE', 'COMPREHENSIVE_EVALUATION', 'PROJECT_CLOSURE'].includes(formType.type)) {
          return true
        }
        
        // Secretary can fill secretary forms
        if (user.roles.includes('SECRETARY') && 
            ['INNOVATION_DECLARATION', 'MIDTERM_CHECK'].includes(formType.type)) {
          return true
        }
        
        // Admin can see all
        if (user.roles.includes('ADMIN')) {
          return true
        }
        
        return false
      })
      
      return filteredTypes
    }),

  // Get form template
  getFormTemplate: protectedProcedure
    .input(
      z.object({
        type: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const template = getFormTemplate(input.type)
      
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单模板不存在'
        })
      }
      
      // Check access based on role
      const user = ctx.session.user
      const hasAccess = 
        user.roles.includes('ADMIN') ||
        (user.roles.includes('STUDENT') && ['LAB_ROTATION_ASSESSMENT', 'SEMESTER_PROGRESS', 'ACHIEVEMENT_STATISTICS'].includes(input.type)) ||
        (user.roles.includes('PROFESSOR') && ['DAILY_GUIDANCE', 'COMPREHENSIVE_EVALUATION', 'PROJECT_CLOSURE'].includes(input.type)) ||
        (user.roles.includes('SECRETARY') && ['INNOVATION_DECLARATION', 'MIDTERM_CHECK'].includes(input.type))
      
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权访问此表单模板'
        })
      }
      
      return template
    }),

  // Create form submission
  submitForm: protectedProcedure
    .input(
      z.object({
        formType: z.string(),
        data: z.record(z.any()),
        projectId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get form template
      const template = getFormTemplate(input.formType)
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单模板不存在'
        })
      }
      
      // Validate form data
      const engine = new FormEngine()
      const validation = engine.validateFormData(template, input.data)
      
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '表单数据验证失败',
          cause: validation.errors
        })
      }
      
      // Check if form template exists in database
      let formTemplate = await ctx.prisma.formTemplate.findUnique({
        where: { type: input.formType }
      })
      
      if (!formTemplate) {
        // Create form template if it doesn't exist
        formTemplate = await ctx.prisma.formTemplate.create({
          data: {
            type: input.formType,
            name: template.title,
            nameEn: template.titleEn,
            description: template.description,
            schema: template as any,
            requiresApproval: template.workflow?.requiresApproval || false,
            approverRoles: template.workflow?.approvers || []
          }
        })
      }
      
      // Create form submission
      const submission = await ctx.prisma.formSubmission.create({
        data: {
          formType: input.formType,
          formTemplateId: formTemplate.id,
          userId: ctx.session.user.id,
          data: input.data,
          status: template.workflow?.requiresApproval ? FormStatus.PENDING : FormStatus.APPROVED,
          projectId: input.projectId
        }
      })
      
      return {
        success: true,
        message: template.workflow?.requiresApproval 
          ? '表单已提交，等待审批' 
          : '表单提交成功',
        data: submission
      }
    }),

  // Get my form submissions
  getMySubmissions: protectedProcedure
    .input(
      z.object({
        formType: z.string().optional(),
        status: z.nativeEnum(FormStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit
      
      const where: any = {
        userId: ctx.session.user.id
      }
      
      if (input.formType) {
        where.formType = input.formType
      }
      
      if (input.status) {
        where.status = input.status
      }
      
      const [submissions, total] = await Promise.all([
        ctx.prisma.formSubmission.findMany({
          where,
          include: {
            formTemplate: {
              select: {
                name: true,
                nameEn: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit
        }),
        ctx.prisma.formSubmission.count({ where })
      ])
      
      return {
        submissions,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      }
    }),

  // Get form submission details
  getSubmission: protectedProcedure
    .input(
      z.object({
        id: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const submission = await ctx.prisma.formSubmission.findUnique({
        where: { id: input.id },
        include: {
          formTemplate: true,
          user: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              studentId: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单提交记录不存在'
        })
      }
      
      // Check access
      const user = ctx.session.user
      const hasAccess = 
        submission.userId === user.id ||
        user.roles.includes('ADMIN') ||
        (user.roles.includes('PROFESSOR') && submission.formTemplate.approverRoles.includes('PROFESSOR')) ||
        (user.roles.includes('SECRETARY') && submission.formTemplate.approverRoles.includes('SECRETARY'))
      
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此表单'
        })
      }
      
      return submission
    }),

  // Review form submission (for approvers)
  reviewSubmission: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['APPROVED', 'REJECTED']),
        reviewComments: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get submission
      const submission = await ctx.prisma.formSubmission.findUnique({
        where: { id: input.id },
        include: {
          formTemplate: true
        }
      })
      
      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单提交记录不存在'
        })
      }
      
      // Check if user can review
      const user = ctx.session.user
      const canReview = submission.formTemplate.approverRoles.some(role => 
        user.roles.includes(role as any)
      )
      
      if (!canReview) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权审批此表单'
        })
      }
      
      // Update submission
      const updated = await ctx.prisma.formSubmission.update({
        where: { id: input.id },
        data: {
          status: input.status as FormStatus,
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewComments: input.reviewComments
        }
      })
      
      return {
        success: true,
        message: input.status === 'APPROVED' ? '表单已批准' : '表单已拒绝',
        data: updated
      }
    }),

  // Get submissions for review
  getSubmissionsForReview: protectedProcedure
    .input(
      z.object({
        formType: z.string().optional(),
        status: z.nativeEnum(FormStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const userRoles = user.roles
      
      // Get form templates this user can review
      const templates = await ctx.prisma.formTemplate.findMany({
        where: {
          approverRoles: {
            hasSome: userRoles
          }
        },
        select: { type: true }
      })
      
      const allowedFormTypes = templates.map(t => t.type)
      
      if (allowedFormTypes.length === 0) {
        return {
          submissions: [],
          total: 0,
          page: input.page,
          totalPages: 0
        }
      }
      
      const skip = (input.page - 1) * input.limit
      
      const where: any = {
        formType: { in: allowedFormTypes }
      }
      
      if (input.formType && allowedFormTypes.includes(input.formType)) {
        where.formType = input.formType
      }
      
      if (input.status) {
        where.status = input.status
      } else {
        // Default to pending submissions
        where.status = FormStatus.PENDING
      }
      
      const [submissions, total] = await Promise.all([
        ctx.prisma.formSubmission.findMany({
          where,
          include: {
            formTemplate: {
              select: {
                name: true,
                nameEn: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                studentId: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: input.limit
        }),
        ctx.prisma.formSubmission.count({ where })
      ])
      
      return {
        submissions,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      }
    }),

  // Update form submission (for draft status)
  updateSubmission: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.record(z.any())
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get submission
      const submission = await ctx.prisma.formSubmission.findUnique({
        where: { id: input.id },
        include: {
          formTemplate: true
        }
      })
      
      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单提交记录不存在'
        })
      }
      
      // Check ownership
      if (submission.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权修改此表单'
        })
      }
      
      // Can only update draft or rejected submissions
      if (submission.status !== FormStatus.DRAFT && submission.status !== FormStatus.REJECTED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只能修改草稿或被拒绝的表单'
        })
      }
      
      // Get form template schema
      const template = getFormTemplate(submission.formType)
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '表单模板不存在'
        })
      }
      
      // Validate new data
      const engine = new FormEngine()
      const validation = engine.validateFormData(template, input.data)
      
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '表单数据验证失败',
          cause: validation.errors
        })
      }
      
      // Update submission
      const updated = await ctx.prisma.formSubmission.update({
        where: { id: input.id },
        data: {
          data: input.data,
          status: FormStatus.PENDING,
          reviewedById: null,
          reviewedAt: null,
          reviewComments: null
        }
      })
      
      return {
        success: true,
        message: '表单已更新并重新提交',
        data: updated
      }
    }),

  // Export form submissions
  exportSubmissions: adminProcedure
    .input(
      z.object({
        formType: z.string().optional(),
        status: z.nativeEnum(FormStatus).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        format: z.enum(['json', 'csv']).default('json')
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}
      
      if (input.formType) {
        where.formType = input.formType
      }
      
      if (input.status) {
        where.status = input.status
      }
      
      if (input.startDate || input.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          where.createdAt.lte = input.endDate
        }
      }
      
      const submissions = await ctx.prisma.formSubmission.findMany({
        where,
        include: {
          formTemplate: true,
          user: {
            select: {
              name: true,
              nameEn: true,
              studentId: true,
              department: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      const engine = new FormEngine()
      const exported = engine.exportFormData(submissions, input.format)
      
      return {
        format: input.format,
        data: exported,
        count: submissions.length
      }
    }),

  // Get form statistics
  getFormStatistics: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}
      
      if (input.startDate || input.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          where.createdAt.lte = input.endDate
        }
      }
      
      // Get statistics by form type
      const byType = await ctx.prisma.formSubmission.groupBy({
        by: ['formType'],
        where,
        _count: true
      })
      
      // Get statistics by status
      const byStatus = await ctx.prisma.formSubmission.groupBy({
        by: ['status'],
        where,
        _count: true
      })
      
      // Get total count
      const total = await ctx.prisma.formSubmission.count({ where })
      
      // Get recent submissions
      const recentSubmissions = await ctx.prisma.formSubmission.findMany({
        where,
        include: {
          formTemplate: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      return {
        total,
        byType: byType.map(item => ({
          type: item.formType,
          count: item._count
        })),
        byStatus: byStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        recentSubmissions
      }
    })
})