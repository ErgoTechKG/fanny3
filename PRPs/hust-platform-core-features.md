# HUST Research Management Platform - Core Features Implementation PRP

## Project Context

The HUST Research Management Platform requires implementation of core features to manage research activities for three experimental classes (启明班, 机卓班, 本硕博班). Based on the PLATFORM_INTEGRATION_GUIDE.md, we need to implement:

1. **Mentor Matching System** - Gale-Shapley algorithm for 3-preference student-mentor matching
2. **Lab Rotation Management** - 3-preference lab assignment with rotation tracking
3. **Progress Tracking** - Daily/weekly/monthly logs with milestone alerts (red/yellow/green)
4. **Four-Dimension Evaluation** - 思想品德(10%), 学业成绩(40%), 科技创新(30%), 科研推进(20%)
5. **Form Automation Engine** - 8 types of forms from 附件2
6. **Excel Data Import/Export** - Migrate existing data from doc-materials
7. **Project Type Distinction** - Innovation projects vs Enterprise projects

## Critical Implementation Context

### 1. Existing Codebase Patterns (MUST FOLLOW)
```typescript
// tRPC Router Pattern - src/server/api/routers/[feature].ts
export const featureRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
    
  create: protectedProcedure
    .input(schema)
    .mutation(async ({ ctx, input }) => {
      // Always return { success: true, message: '中文消息', data }
    }),
})

// Form Pattern - components/features/[feature]/[feature]-form.tsx
const formSchema = z.object({...})
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {...}
})
```

### 2. Algorithm Resources
- **Gale-Shapley TypeScript Implementation**: https://github.com/colorstackorg/stable-matching
- **Algorithm Explanation**: https://medium.com/aiskunks/understanding-gale-shapley-stable-matching-algorithm-and-its-time-complexity-4b814ee2642
- **Time Complexity**: O(n²) - suitable for ~150 students and ~50 mentors

### 3. Excel Handling
- **Library**: xlsx (SheetJS) - https://docs.sheetjs.com/
- **Pattern**: Use ArrayBuffer for file reading, sheet_to_json for parsing
- **Chinese Column Names**: Handle encoding properly with UTF-8

### 4. Dynamic Forms
- **Library**: React Hook Form + JSON Schema
- **Reference**: https://github.com/vtex/react-hook-form-jsonschema
- **Pattern**: Store form schemas in database, render dynamically

### 5. Database Schema Extensions
Already defined in PLATFORM_INTEGRATION_GUIDE.md:
- MentorApplication
- Lab
- LabRotationApplication
- RotationLog
- FormTemplate
- FormSubmission

## Implementation Blueprint

### Phase 1: Database and Core Models (Priority: HIGH)

```typescript
// 1. Create migration file
// prisma/migrations/add_mentor_system.sql

// 2. Update schema.prisma with new models
model MentorApplication {
  id              String   @id @default(cuid())
  studentId       String
  academicYear    String
  
  firstChoiceId   String
  firstReason     String   @db.Text
  secondChoiceId  String?
  secondReason    String?  @db.Text
  thirdChoiceId   String?
  thirdReason     String?  @db.Text
  
  status          MentorApplicationStatus @default(PENDING)
  finalMentorId   String?
  
  // Relations...
}

// 3. Run migration
npx prisma migrate dev --name add_mentor_system
```

### Phase 2: Mentor Matching Implementation

```typescript
// src/lib/algorithms/gale-shapley.ts
interface Preference {
  studentId: string
  choices: Array<{ mentorId: string; order: number }>
  gpa: number
  researchMatch: number
}

interface MentorCapacity {
  mentorId: string
  capacity: number
  preferences: string[] // Ordered student IDs
}

export class GaleShapleyMatcher {
  private studentPrefs: Map<string, string[]>
  private mentorPrefs: Map<string, string[]>
  private mentorCapacity: Map<string, number>
  
  match(applications: MentorApplication[], capacities: Map<string, number>) {
    // Phase 1: Build preference lists
    this.buildPreferences(applications)
    
    // Phase 2: Run matching rounds
    const matches = new Map<string, string>()
    const freeStudents = new Set(applications.map(a => a.studentId))
    
    while (freeStudents.size > 0) {
      // Student proposes to next choice
      for (const studentId of freeStudents) {
        const proposal = this.getNextProposal(studentId)
        if (!proposal) {
          freeStudents.delete(studentId)
          continue
        }
        
        // Mentor evaluates proposal
        if (this.acceptProposal(proposal.mentorId, studentId, matches)) {
          matches.set(studentId, proposal.mentorId)
          freeStudents.delete(studentId)
        }
      }
    }
    
    return matches
  }
}

// src/server/api/routers/mentor.ts
export const mentorRouter = createTRPCRouter({
  apply: protectedProcedure
    .input(mentorApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate student doesn't have existing application
      const existing = await ctx.prisma.mentorApplication.findUnique({
        where: {
          studentId_academicYear: {
            studentId: ctx.session.user.id,
            academicYear: input.academicYear,
          }
        }
      })
      
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '您已经提交过导师申请'
        })
      }
      
      // Create application
      const application = await ctx.prisma.mentorApplication.create({
        data: input
      })
      
      return {
        success: true,
        message: '导师申请提交成功',
        data: application
      }
    }),
    
  runMatching: adminProcedure
    .input(z.object({ academicYear: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get all applications
      const applications = await ctx.prisma.mentorApplication.findMany({
        where: { academicYear: input.academicYear },
        include: { student: true }
      })
      
      // Get mentor capacities
      const mentors = await ctx.prisma.user.findMany({
        where: { roles: { some: { role: 'PROFESSOR' } } }
      })
      
      const capacities = new Map(
        mentors.map(m => [m.id, m.maxStudents || 3])
      )
      
      // Run algorithm
      const matcher = new GaleShapleyMatcher()
      const matches = matcher.match(applications, capacities)
      
      // Update applications with results
      await ctx.prisma.$transaction(
        Array.from(matches.entries()).map(([studentId, mentorId]) =>
          ctx.prisma.mentorApplication.update({
            where: {
              studentId_academicYear: {
                studentId,
                academicYear: input.academicYear
              }
            },
            data: {
              status: 'MATCHED',
              finalMentorId: mentorId
            }
          })
        )
      )
      
      return {
        success: true,
        message: `匹配完成，共 ${matches.size} 个学生成功匹配导师`,
        data: { matchCount: matches.size }
      }
    })
})
```

### Phase 3: Lab Rotation System

```typescript
// src/lib/algorithms/lab-rotation.ts
export class LabRotationAllocator {
  allocate(
    applications: LabRotationApplication[],
    labCapacities: Map<string, number>
  ): Map<string, string> {
    const assignments = new Map<string, string>()
    const remainingCapacity = new Map(labCapacities)
    
    // Round 1: First choices
    for (const app of applications) {
      const firstChoice = app.choices.find(c => c.order === 1)
      if (firstChoice && this.hasCapacity(firstChoice.labId, remainingCapacity)) {
        assignments.set(app.studentId, firstChoice.labId)
        this.decrementCapacity(firstChoice.labId, remainingCapacity)
      }
    }
    
    // Round 2 & 3: Second and third choices
    // ... similar logic
    
    return assignments
  }
}

// src/server/api/routers/lab.ts
export const labRouter = createTRPCRouter({
  applyRotation: protectedProcedure
    .input(labRotationSchema)
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.labRotationApplication.create({
        data: {
          studentId: ctx.session.user.id,
          semester: input.semester,
          choices: input.choices,
          status: 'PENDING'
        }
      })
      
      return {
        success: true,
        message: '实验室轮转申请提交成功',
        data: application
      }
    }),
    
  submitLog: protectedProcedure
    .input(rotationLogSchema)
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.rotationLog.create({
        data: input
      })
      
      return {
        success: true,
        message: '轮转日志提交成功',
        data: log
      }
    })
})
```

### Phase 4: Progress Tracking with Alerts

```typescript
// src/lib/services/progress-alert.ts
export class ProgressAlertService {
  calculateAlertLevel(milestone: ProjectMilestone): AlertLevel {
    const now = new Date()
    const dueDate = new Date(milestone.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (milestone.status === 'COMPLETED') return 'GREEN'
    if (milestone.status === 'AT_RISK' || daysUntilDue < 0) return 'RED'
    if (daysUntilDue < 7) return 'YELLOW'
    return 'GREEN'
  }
  
  async checkAllMilestones(projectId: string) {
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId }
    })
    
    for (const milestone of milestones) {
      const alertLevel = this.calculateAlertLevel(milestone)
      if (milestone.alertLevel !== alertLevel) {
        await prisma.projectMilestone.update({
          where: { id: milestone.id },
          data: { alertLevel }
        })
        
        // Send notification if RED
        if (alertLevel === 'RED') {
          await this.sendAlert(milestone)
        }
      }
    }
  }
}

// src/server/api/routers/progress.ts
export const progressRouter = createTRPCRouter({
  submitLog: protectedProcedure
    .input(researchLogSchema)
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.researchLog.create({
        data: {
          ...input,
          studentId: ctx.session.user.id
        }
      })
      
      // Check if 4-week summary needed
      if (input.weekNumber && input.weekNumber % 4 === 0) {
        // Prompt for summary
      }
      
      return {
        success: true,
        message: '科研日志提交成功',
        data: log
      }
    }),
    
  getMilestones: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.prisma.projectMilestone.findMany({
        where: { projectId: input.projectId },
        orderBy: { dueDate: 'asc' }
      })
      
      // Update alert levels
      const alertService = new ProgressAlertService()
      await alertService.checkAllMilestones(input.projectId)
      
      return milestones
    })
})
```

### Phase 5: Four-Dimension Evaluation System

```typescript
// src/lib/services/evaluation-calculator.ts
interface EvaluationData {
  moral: { base: number; additions: Item[]; deductions: Item[] }
  academic: { gpa: number; maxGpa: number; coreCourseAvg: number }
  innovation: { papers: Paper[]; patents: Patent[]; competitions: Competition[] }
  research: { progressScore: number; logQuality: number; mentorScore: number }
}

export class EvaluationCalculator {
  private weights = {
    moral: 0.1,      // 思想品德 10%
    academic: 0.4,   // 学业成绩 40%
    innovation: 0.3, // 科技创新 30%
    research: 0.2    // 科研推进 20%
  }
  
  calculate(data: EvaluationData): EvaluationResult {
    const scores = {
      moral: this.calculateMoral(data.moral),
      academic: this.calculateAcademic(data.academic),
      innovation: this.calculateInnovation(data.innovation),
      research: this.calculateResearch(data.research)
    }
    
    const total = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * this.weights[key as keyof typeof this.weights],
      0
    )
    
    return {
      ...scores,
      total,
      rank: this.getRank(total)
    }
  }
  
  private calculateInnovation(innovation: InnovationData): number {
    let score = 0
    
    // Paper scoring based on 2024年综合素质评价方案
    for (const paper of innovation.papers) {
      if (paper.type === 'SCI' && paper.authorOrder === 1) score += 40
      else if (paper.type === 'SCI' && paper.authorOrder === 2) score += 20
      else if (paper.type === 'EI' && paper.authorOrder === 1) score += 30
      else if (paper.type === 'EI' && paper.authorOrder === 2) score += 15
      else if (paper.type === '核心期刊' && paper.authorOrder === 1) score += 20
      else if (paper.type === '核心期刊' && paper.authorOrder === 2) score += 10
    }
    
    // Patent scoring
    for (const patent of innovation.patents) {
      if (patent.type === 'INVENTION' && patent.inventorOrder === 1) score += 30
      else if (patent.type === 'INVENTION' && patent.inventorOrder <= 3) score += 15
      else if (patent.type === 'UTILITY' && patent.inventorOrder === 1) score += 15
      else if (patent.type === 'UTILITY' && patent.inventorOrder <= 3) score += 8
    }
    
    // Competition scoring
    for (const comp of innovation.competitions) {
      const baseScore = this.getCompetitionBaseScore(comp.level, comp.award)
      score += baseScore
    }
    
    return Math.min(100, score) // Cap at 100
  }
}

// src/server/api/routers/evaluation.ts
export const evaluationRouter = createTRPCRouter({
  calculate: protectedProcedure
    .input(evaluationInputSchema)
    .query(async ({ ctx, input }) => {
      // Gather all data
      const student = await ctx.prisma.user.findUnique({
        where: { id: input.studentId },
        include: {
          achievements: true,
          studentProgress: true,
          // ... other relations
        }
      })
      
      // Calculate scores
      const calculator = new EvaluationCalculator()
      const result = calculator.calculate(transformToEvaluationData(student))
      
      // Save evaluation
      await ctx.prisma.evaluation.create({
        data: {
          studentId: input.studentId,
          year: input.year,
          semester: input.semester,
          ...result
        }
      })
      
      return result
    })
})
```

### Phase 6: Form Automation Engine

```typescript
// src/lib/forms/form-engine.ts
interface FormSchema {
  fields: Array<{
    name: string
    type: 'text' | 'number' | 'select' | 'file' | 'array'
    label: string
    validation?: any
    options?: Array<{ value: string; label: string }>
  }>
  sections?: Array<{
    title: string
    fields: string[]
  }>
}

// src/components/features/forms/dynamic-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface DynamicFormProps {
  schema: FormSchema
  onSubmit: (data: any) => void
}

export function DynamicForm({ schema, onSubmit }: DynamicFormProps) {
  const zodSchema = generateZodSchema(schema)
  const form = useForm({
    resolver: zodResolver(zodSchema)
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {schema.sections?.map((section) => (
          <div key={section.title}>
            <h3>{section.title}</h3>
            {section.fields.map((fieldName) => {
              const field = schema.fields.find(f => f.name === fieldName)
              return <DynamicField key={fieldName} field={field} form={form} />
            })}
          </div>
        ))}
        <Button type="submit">提交</Button>
      </form>
    </Form>
  )
}

// Form templates for 8 types
export const formTemplates = {
  MENTOR_INFO: {
    name: '导师信息表',
    fields: [
      { name: 'name', type: 'text', label: '姓名' },
      { name: 'employeeId', type: 'text', label: '工号' },
      { name: 'title', type: 'select', label: '职称', options: [
        { value: 'PROFESSOR', label: '教授' },
        { value: 'ASSOCIATE_PROFESSOR', label: '副教授' }
      ]},
      { name: 'researchAreas', type: 'array', label: '研究方向' },
      { name: 'maxStudents', type: 'number', label: '可指导学生数' }
    ]
  },
  MENTOR_APPLICATION: {
    name: '学生选择导师意向书',
    fields: [
      { name: 'firstChoice', type: 'select', label: '第一志愿导师' },
      { name: 'firstReason', type: 'text', label: '选择理由' },
      { name: 'secondChoice', type: 'select', label: '第二志愿导师' },
      { name: 'secondReason', type: 'text', label: '选择理由' },
      { name: 'personalStatement', type: 'text', label: '个人陈述' }
    ]
  }
  // ... other 6 forms
}
```

### Phase 7: Excel Import/Export

```typescript
// src/lib/excel/importer.ts
import * as XLSX from 'xlsx'

export class ExcelImporter {
  async importMentors(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet)
    
    return data.map(row => ({
      name: row['姓名'],
      employeeId: row['工号'],
      title: this.mapTitle(row['职称']),
      department: row['院系'],
      researchAreas: row['研究方向']?.split('、') || [],
      email: row['邮箱'],
      phone: row['电话'],
      maxStudents: parseInt(row['可指导学生数']) || 3
    }))
  }
  
  async importEvaluationData(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    const evaluations = []
    
    // Process each sheet for different dimensions
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet)
      
      if (sheetName.includes('思想品德')) {
        // Process moral scores
      } else if (sheetName.includes('学业成绩')) {
        // Process academic scores
      } else if (sheetName.includes('科技创新')) {
        // Process innovation scores
      } else if (sheetName.includes('科研推进')) {
        // Process research scores
      }
    }
    
    return evaluations
  }
}

// src/server/api/routers/import.ts
export const importRouter = createTRPCRouter({
  importMentors: adminProcedure
    .input(z.object({ fileUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Download file
      const response = await fetch(input.fileUrl)
      const buffer = await response.arrayBuffer()
      const file = new File([buffer], 'mentors.xlsx')
      
      // Import data
      const importer = new ExcelImporter()
      const mentors = await importer.importMentors(file)
      
      // Bulk create
      const results = await ctx.prisma.$transaction(
        mentors.map(mentor => 
          ctx.prisma.user.create({
            data: {
              ...mentor,
              password: bcrypt.hashSync('temp123', 10),
              roles: {
                create: { role: 'PROFESSOR' }
              }
            }
          })
        )
      )
      
      return {
        success: true,
        message: `成功导入 ${results.length} 位导师`,
        data: { count: results.length }
      }
    })
})
```

## Validation Gates

```bash
# 1. TypeScript and Linting
npm run type-check
npm run lint

# 2. Unit Tests
npm test -- --coverage

# 3. Integration Tests
npm run test:integration

# 4. Database Migrations
npx prisma migrate deploy
npx prisma db seed

# 5. Build Verification
npm run build

# 6. E2E Tests (key flows)
npm run test:e2e -- mentor-application.spec.ts
npm run test:e2e -- lab-rotation.spec.ts
npm run test:e2e -- evaluation.spec.ts
```

## Implementation Order

1. **Week 1**: Database schema + Mentor matching system
2. **Week 2**: Lab rotation + Progress tracking
3. **Week 3**: Evaluation system + Form automation (first 4 forms)
4. **Week 4**: Remaining forms + Excel import/export
5. **Week 5**: Testing + Bug fixes + Performance optimization

## Error Handling Strategy

```typescript
// Consistent error handling across all features
try {
  // Operation
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '数据已存在'
      })
    }
  }
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: '操作失败，请稍后重试'
  })
}
```

## Performance Considerations

1. **Batch Operations**: Use `prisma.$transaction()` for bulk updates
2. **Pagination**: Always paginate lists with default limit of 20
3. **Caching**: Consider Redis for frequently accessed data (mentor lists, lab info)
4. **Indexes**: Add database indexes for commonly queried fields
5. **File Uploads**: Use streaming for large Excel files

## Security Measures

1. **Role-based Access**: Use existing procedures (protectedProcedure, professorProcedure, adminProcedure)
2. **Input Validation**: Zod schemas for all inputs
3. **SQL Injection**: Prisma parameterized queries
4. **File Upload**: Validate file types and sizes
5. **Rate Limiting**: Add to sensitive operations (matching algorithm)

## Documentation Requirements

1. **API Documentation**: Document all new tRPC endpoints
2. **User Guides**: Create guides for each major feature
3. **Admin Manual**: Document matching algorithm parameters
4. **Migration Guide**: Document Excel format requirements

## Success Metrics

1. **Mentor Matching**: 95%+ students successfully matched
2. **Performance**: <200ms API response time
3. **Data Import**: Handle 10,000+ records
4. **User Satisfaction**: Simplified workflow vs Excel

## Confidence Score: 9/10

High confidence due to:
- Clear requirements from integration guide
- Existing codebase patterns to follow
- Well-documented external resources
- Comprehensive validation gates
- Phased implementation approach

Slight uncertainty in:
- Exact scoring rules for evaluation (may need clarification)
- Complex Excel formats from doc-materials