import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { ExcelService, excelTemplates, getExcelTemplate } from '@/lib/services/excel-service'
import { AchievementType, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const importRouter = createTRPCRouter({
  // Get available templates
  getTemplates: adminProcedure
    .query(async ({ ctx }) => {
      return Object.keys(excelTemplates).map(key => ({
        key,
        name: excelTemplates[key as keyof typeof excelTemplates].name,
        nameEn: excelTemplates[key as keyof typeof excelTemplates].nameEn,
        description: excelTemplates[key as keyof typeof excelTemplates].description
      }))
    }),

  // Download template
  downloadTemplate: adminProcedure
    .input(
      z.object({
        templateName: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const template = getExcelTemplate(input.templateName)
      
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '模板不存在'
        })
      }
      
      const buffer = ExcelService.createTemplate(template)
      
      return {
        buffer: buffer.toString('base64'),
        filename: `${template.name}-模板.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }),

  // Validate import file
  validateImport: adminProcedure
    .input(
      z.object({
        templateName: z.string(),
        fileBuffer: z.string(), // base64 encoded
        sheetName: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = getExcelTemplate(input.templateName)
      
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '模板不存在'
        })
      }
      
      const buffer = Buffer.from(input.fileBuffer, 'base64')
      const sheet = template.sheets[0] // Use first sheet
      
      // Validate structure
      const structureValidation = ExcelService.validateStructure(
        buffer,
        sheet.columns,
        input.sheetName
      )
      
      if (!structureValidation.valid) {
        return {
          valid: false,
          errors: structureValidation.errors
        }
      }
      
      // Validate content
      const importResult = ExcelService.importFromExcel(
        buffer,
        sheet.columns,
        input.sheetName,
        sheet.validation
      )
      
      return {
        valid: importResult.success,
        totalRows: importResult.totalRows,
        validRows: importResult.validRows,
        invalidRows: importResult.invalidRows,
        errors: importResult.errors,
        preview: importResult.data.slice(0, 5) // Show first 5 rows as preview
      }
    }),

  // Import users
  importUsers: adminProcedure
    .input(
      z.object({
        fileBuffer: z.string(), // base64 encoded
        sheetName: z.string().optional(),
        overwriteExisting: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = getExcelTemplate('users')!
      const buffer = Buffer.from(input.fileBuffer, 'base64')
      
      const importResult = ExcelService.importFromExcel(
        buffer,
        template.sheets[0].columns,
        input.sheetName
      )
      
      if (!importResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '导入数据验证失败',
          cause: importResult.errors
        })
      }
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      for (const userData of importResult.data) {
        try {
          // Check if user exists
          const existingUser = await ctx.prisma.user.findUnique({
            where: { email: userData.email }
          })
          
          if (existingUser && !input.overwriteExisting) {
            errors.push(`用户 ${userData.email} 已存在，跳过`)
            continue
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(userData.password, 10)
          
          // Parse roles
          const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles]
          
          // Create or update user
          const user = await ctx.prisma.user.upsert({
            where: { email: userData.email },
            update: {
              name: userData.name,
              nameEn: userData.nameEn,
              studentId: userData.studentId,
              phone: userData.phone,
              department: userData.department,
              password: hashedPassword
            },
            create: {
              email: userData.email,
              name: userData.name,
              nameEn: userData.nameEn,
              studentId: userData.studentId,
              phone: userData.phone,
              department: userData.department,
              password: hashedPassword
            }
          })
          
          // Update roles
          await ctx.prisma.userRole.deleteMany({
            where: { userId: user.id }
          })
          
          await ctx.prisma.userRole.createMany({
            data: roles.map((role: string) => ({
              userId: user.id,
              role: role as Role
            }))
          })
          
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`用户 ${userData.email} 导入失败: ${error}`)
        }
      }
      
      return {
        success: true,
        message: `导入完成: 成功 ${successCount} 个，失败 ${errorCount} 个`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    }),

  // Import topics
  importTopics: adminProcedure
    .input(
      z.object({
        fileBuffer: z.string(),
        sheetName: z.string().optional(),
        overwriteExisting: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = getExcelTemplate('topics')!
      const buffer = Buffer.from(input.fileBuffer, 'base64')
      
      const importResult = ExcelService.importFromExcel(
        buffer,
        template.sheets[0].columns,
        input.sheetName
      )
      
      if (!importResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '导入数据验证失败',
          cause: importResult.errors
        })
      }
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      for (const topicData of importResult.data) {
        try {
          // Find professor by email
          const professor = await ctx.prisma.user.findUnique({
            where: { email: topicData.professorEmail },
            include: { roles: true }
          })
          
          if (!professor || !professor.roles.some(r => r.role === 'PROFESSOR')) {
            errors.push(`教授 ${topicData.professorEmail} 不存在或不是教授角色`)
            errorCount++
            continue
          }
          
          // Check if topic exists
          const existingTopic = await ctx.prisma.topic.findFirst({
            where: { 
              title: topicData.title,
              professorId: professor.id
            }
          })
          
          if (existingTopic && !input.overwriteExisting) {
            errors.push(`题目 "${topicData.title}" 已存在，跳过`)
            continue
          }
          
          // Create or update topic
          await ctx.prisma.topic.upsert({
            where: { 
              id: existingTopic?.id || 'new-topic'
            },
            update: {
              title: topicData.title,
              titleEn: topicData.titleEn,
              description: topicData.description,
              field: topicData.field,
              difficulty: topicData.difficulty,
              maxStudents: topicData.maxStudents,
              prerequisites: topicData.prerequisites || [],
              expectedOutcomes: topicData.expectedOutcomes || [],
              type: topicData.type
            },
            create: {
              title: topicData.title,
              titleEn: topicData.titleEn,
              description: topicData.description,
              professorId: professor.id,
              field: topicData.field,
              difficulty: topicData.difficulty,
              maxStudents: topicData.maxStudents,
              prerequisites: topicData.prerequisites || [],
              expectedOutcomes: topicData.expectedOutcomes || [],
              type: topicData.type
            }
          })
          
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`题目 "${topicData.title}" 导入失败: ${error}`)
        }
      }
      
      return {
        success: true,
        message: `导入完成: 成功 ${successCount} 个，失败 ${errorCount} 个`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10)
      }
    }),

  // Import achievements
  importAchievements: adminProcedure
    .input(
      z.object({
        fileBuffer: z.string(),
        sheetName: z.string().optional(),
        overwriteExisting: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = getExcelTemplate('achievements')!
      const buffer = Buffer.from(input.fileBuffer, 'base64')
      
      const importResult = ExcelService.importFromExcel(
        buffer,
        template.sheets[0].columns,
        input.sheetName
      )
      
      if (!importResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '导入数据验证失败',
          cause: importResult.errors
        })
      }
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      for (const achievementData of importResult.data) {
        try {
          // Find student by email
          const student = await ctx.prisma.user.findUnique({
            where: { email: achievementData.studentEmail },
            include: { roles: true }
          })
          
          if (!student || !student.roles.some(r => r.role === 'STUDENT')) {
            errors.push(`学生 ${achievementData.studentEmail} 不存在或不是学生角色`)
            errorCount++
            continue
          }
          
          // Check if achievement exists
          const existingAchievement = await ctx.prisma.achievement.findFirst({
            where: { 
              title: achievementData.title,
              studentId: student.id,
              type: achievementData.type as AchievementType
            }
          })
          
          if (existingAchievement && !input.overwriteExisting) {
            errors.push(`成果 "${achievementData.title}" 已存在，跳过`)
            continue
          }
          
          // Create or update achievement
          await ctx.prisma.achievement.upsert({
            where: { 
              id: existingAchievement?.id || 'new-achievement'
            },
            update: {
              title: achievementData.title,
              description: achievementData.description,
              type: achievementData.type as AchievementType,
              proof: achievementData.proof,
              score: achievementData.score,
              verified: achievementData.verified || false
            },
            create: {
              title: achievementData.title,
              description: achievementData.description,
              type: achievementData.type as AchievementType,
              proof: achievementData.proof,
              score: achievementData.score,
              verified: achievementData.verified || false,
              studentId: student.id
            }
          })
          
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`成果 "${achievementData.title}" 导入失败: ${error}`)
        }
      }
      
      return {
        success: true,
        message: `导入完成: 成功 ${successCount} 个，失败 ${errorCount} 个`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10)
      }
    }),

  // Import labs
  importLabs: adminProcedure
    .input(
      z.object({
        fileBuffer: z.string(),
        sheetName: z.string().optional(),
        overwriteExisting: z.boolean().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = getExcelTemplate('labs')!
      const buffer = Buffer.from(input.fileBuffer, 'base64')
      
      const importResult = ExcelService.importFromExcel(
        buffer,
        template.sheets[0].columns,
        input.sheetName
      )
      
      if (!importResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '导入数据验证失败',
          cause: importResult.errors
        })
      }
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      for (const labData of importResult.data) {
        try {
          // Find director by email
          const director = await ctx.prisma.user.findUnique({
            where: { email: labData.directorEmail },
            include: { roles: true }
          })
          
          if (!director || !director.roles.some(r => r.role === 'PROFESSOR')) {
            errors.push(`负责人 ${labData.directorEmail} 不存在或不是教授角色`)
            errorCount++
            continue
          }
          
          // Check if lab exists
          const existingLab = await ctx.prisma.lab.findFirst({
            where: { 
              OR: [
                { code: labData.code },
                { name: labData.name }
              ]
            }
          })
          
          if (existingLab && !input.overwriteExisting) {
            errors.push(`实验室 "${labData.name}" 已存在，跳过`)
            continue
          }
          
          // Create or update lab
          await ctx.prisma.lab.upsert({
            where: { 
              id: existingLab?.id || 'new-lab'
            },
            update: {
              name: labData.name,
              nameEn: labData.nameEn,
              code: labData.code,
              description: labData.description,
              capacity: labData.capacity,
              location: labData.location,
              researchAreas: labData.researchAreas || [],
              equipment: labData.equipment || [],
              website: labData.website
            },
            create: {
              name: labData.name,
              nameEn: labData.nameEn,
              code: labData.code,
              description: labData.description,
              directorId: director.id,
              capacity: labData.capacity,
              location: labData.location,
              researchAreas: labData.researchAreas || [],
              equipment: labData.equipment || [],
              website: labData.website
            }
          })
          
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`实验室 "${labData.name}" 导入失败: ${error}`)
        }
      }
      
      return {
        success: true,
        message: `导入完成: 成功 ${successCount} 个，失败 ${errorCount} 个`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10)
      }
    }),

  // Export data
  exportData: adminProcedure
    .input(
      z.object({
        entityType: z.enum(['users', 'topics', 'achievements', 'labs', 'projects']),
        filters: z.record(z.any()).optional(),
        format: z.enum(['xlsx', 'csv']).default('xlsx')
      })
    )
    .mutation(async ({ ctx, input }) => {
      let data: any[] = []
      let columns: any[] = []
      let fileName = ''
      
      switch (input.entityType) {
        case 'users':
          data = await ctx.prisma.user.findMany({
            include: { roles: true },
            where: input.filters
          })
          columns = excelTemplates.users.sheets[0].columns
          fileName = '用户数据.xlsx'
          
          // Transform data
          data = data.map(user => ({
            email: user.email,
            name: user.name,
            nameEn: user.nameEn,
            studentId: user.studentId,
            phone: user.phone,
            department: user.department,
            roles: user.roles.map(r => r.role).join(', '),
            createdAt: user.createdAt
          }))
          break
          
        case 'topics':
          data = await ctx.prisma.topic.findMany({
            include: { 
              professor: { select: { name: true, email: true } }
            },
            where: input.filters
          })
          columns = excelTemplates.topics.sheets[0].columns
          fileName = '题目数据.xlsx'
          
          // Transform data
          data = data.map(topic => ({
            title: topic.title,
            titleEn: topic.titleEn,
            description: topic.description,
            professorEmail: topic.professor.email,
            field: topic.field,
            difficulty: topic.difficulty,
            maxStudents: topic.maxStudents,
            prerequisites: topic.prerequisites.join(', '),
            expectedOutcomes: topic.expectedOutcomes.join(', '),
            type: topic.type,
            status: topic.status,
            createdAt: topic.createdAt
          }))
          break
          
        case 'achievements':
          data = await ctx.prisma.achievement.findMany({
            include: { 
              student: { select: { name: true, email: true } }
            },
            where: input.filters
          })
          columns = excelTemplates.achievements.sheets[0].columns
          fileName = '成果数据.xlsx'
          
          // Transform data
          data = data.map(achievement => ({
            studentEmail: achievement.student.email,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            proof: achievement.proof,
            score: achievement.score,
            verified: achievement.verified,
            createdAt: achievement.createdAt
          }))
          break
          
        case 'labs':
          data = await ctx.prisma.lab.findMany({
            include: { 
              director: { select: { name: true, email: true } }
            },
            where: input.filters
          })
          columns = excelTemplates.labs.sheets[0].columns
          fileName = '实验室数据.xlsx'
          
          // Transform data
          data = data.map(lab => ({
            name: lab.name,
            nameEn: lab.nameEn,
            code: lab.code,
            description: lab.description,
            directorEmail: lab.director.email,
            capacity: lab.capacity,
            location: lab.location,
            researchAreas: lab.researchAreas.join(', '),
            equipment: lab.equipment.join(', '),
            website: lab.website,
            createdAt: lab.createdAt
          }))
          break
          
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '不支持的实体类型'
          })
      }
      
      const buffer = ExcelService.exportToExcel(data, columns, fileName)
      
      return {
        buffer: buffer.toString('base64'),
        filename: fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        count: data.length
      }
    }),

  // Get import history
  getImportHistory: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      // This would require an ImportHistory model in the database
      // For now, return empty array
      return {
        history: [],
        total: 0,
        page: input.page,
        totalPages: 0
      }
    })
})