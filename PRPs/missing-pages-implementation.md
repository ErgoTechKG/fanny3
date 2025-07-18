name: "HUST Research Management Platform - Missing Pages Implementation"
description: |
  Comprehensive PRP for implementing Progress, Calendar, and Settings pages with all necessary context,
  patterns from the codebase, and validation loops to ensure one-pass implementation success.

---

## Goal
Implement three critical missing pages for the HUST Research Management Platform:
1. **Progress Page** (`/progress`) - Research progress tracking with milestones, logs, and visualizations
2. **Calendar Page** (`/calendar`) - Event management and scheduling system
3. **Settings Page** (`/settings`) - User preferences and account management

These pages are essential for completing the research management workflow and have been referenced but not implemented in the current system.

## Why
- **Progress tracking** is critical for monitoring research projects and student evaluation
- **Calendar integration** improves coordination between students and professors
- **Settings management** provides quality of life improvements and customization
- These features complete the core functionality loop of the platform
- Referenced in navigation but currently return 404 errors

## What
### User-Visible Behavior
- Students can submit daily/weekly research logs and view progress visualizations
- Professors can review progress, provide feedback, and approve milestones
- All users can view/manage events and deadlines in calendar
- Users can customize notification preferences and profile information

### Technical Requirements
- Follow existing tRPC patterns for API routes
- Use shadcn/ui components for consistency
- Implement role-based access control
- Add Prisma schema migrations for new models
- Ensure mobile-responsive design

### Success Criteria
- [ ] All three pages render without errors
- [ ] tRPC endpoints work with proper authentication
- [ ] Database migrations run successfully
- [ ] Role-based features work correctly
- [ ] Forms validate and submit properly
- [ ] UI matches existing design patterns

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs/app/building-your-application/routing
  why: Next.js 14 App Router page implementation patterns
  
- url: https://trpc.io/docs/v10/server/adapters/nextjs
  why: tRPC integration with Next.js, focus on fetch adapter for App Router
  
- url: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
  why: Best practices for Prisma Client singleton pattern
  
- file: /src/app/topics/page.tsx
  why: Reference for page structure, authentication, data fetching patterns
  
- file: /src/server/api/routers/topic.ts
  why: tRPC router patterns, Zod validation, procedures
  
- file: /src/components/ui/calendar.tsx
  why: Calendar component already exists, use for calendar page
  
- file: /prisma/schema.prisma
  why: Current database schema to extend
  
- doc: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dynamic
  section: Avoiding route caching issues
  critical: Use "force-dynamic" to prevent stale data in Next.js Data Cache
```

### Current Codebase Tree
```bash
src/
├── app/
│   ├── achievements/
│   ├── api/
│   │   ├── auth/
│   │   └── trpc/
│   ├── dashboard/
│   ├── login/
│   ├── register/
│   ├── topics/
│   │   ├── [id]/
│   │   ├── applications/
│   │   └── create/
│   └── globals.css
├── components/
│   ├── charts/
│   ├── features/
│   ├── layouts/
│   ├── providers/
│   └── ui/
├── hooks/
├── lib/
├── server/
│   ├── api/
│   │   ├── routers/
│   │   ├── root.ts
│   │   └── trpc.ts
│   └── db/
└── types/
```

### Desired Codebase Tree with Files to be Added
```bash
src/
├── app/
│   ├── progress/
│   │   └── page.tsx         # Progress tracking main page
│   ├── calendar/
│   │   └── page.tsx         # Calendar view page
│   ├── settings/
│   │   └── page.tsx         # Settings management page
├── server/
│   └── api/
│       └── routers/
│           ├── progress.ts   # Progress tracking API routes
│           ├── calendar.ts   # Calendar/events API routes
│           └── settings.ts   # Settings management API routes
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Next.js hot-reload creates multiple Prisma instances
// Always use singleton pattern from lib/prisma.ts

// CRITICAL: Next.js caches fetch requests by default
// Use export const dynamic = 'force-dynamic' for real-time data pages

// CRITICAL: tRPC procedures have specific patterns:
// - protectedProcedure: requires authentication
// - professorProcedure: requires PROFESSOR role
// - adminProcedure: requires ADMIN role

// CRITICAL: All pages must use 'use client' directive
// Server Components not used in this codebase pattern

// CRITICAL: Chinese UI is primary, English fields are optional
// Use Chinese labels/messages, optionally store English versions

// CRITICAL: HUST brand color is #005BAC
// Use for primary buttons and brand elements
```

## Implementation Blueprint

### Data Models and Structure

First, update the Prisma schema with the models defined in MISSING_PAGES.md:

```prisma
// Add to prisma/schema.prisma

model ResearchLog {
  id          String   @id @default(cuid())
  studentId   String
  projectId   String
  content     String   @db.Text
  type        LogType
  weekNumber  Int?
  attachments String[]
  
  student     User     @relation(fields: [studentId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProjectMilestone {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  nameEn      String?
  type        MilestoneType
  status      MilestoneStatus @default(PENDING)
  alertLevel  AlertLevel @default(GREEN)
  dueDate     DateTime
  completedAt DateTime?
  
  project     Project  @relation(fields: [projectId], references: [id])
  feedback    ProfessorFeedback[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ... (rest of the models from MISSING_PAGES.md)
```

### List of Tasks

```yaml
Task 1 - Update Prisma Schema:
MODIFY prisma/schema.prisma:
  - ADD all models from MISSING_PAGES.md (ResearchLog, ProjectMilestone, etc.)
  - ADD all enums (LogType, MilestoneType, etc.)
  - ENSURE proper relations with existing models
  - RUN: npx prisma migrate dev --name add-missing-pages-models

Task 2 - Create Progress Router:
CREATE src/server/api/routers/progress.ts:
  - MIRROR pattern from: src/server/api/routers/topic.ts
  - IMPLEMENT procedures: getProjectProgress, submitResearchLog, getMilestones, etc.
  - USE role-based procedures (protectedProcedure, professorProcedure)
  - VALIDATE inputs with Zod schemas

Task 3 - Create Calendar Router:
CREATE src/server/api/routers/calendar.ts:
  - FOLLOW pattern from existing routers
  - IMPLEMENT: getEvents, createEvent, updateAttendeeStatus, etc.
  - HANDLE date/time with proper timezone (Asia/Shanghai)
  - INTEGRATE with milestone deadlines

Task 4 - Create Settings Router:
CREATE src/server/api/routers/settings.ts:
  - IMPLEMENT: getUserSettings, updateNotificationPreferences, changePassword
  - USE transaction for password change
  - STORE role-specific settings as JSON

Task 5 - Update API Root:
MODIFY src/server/api/root.ts:
  - IMPORT new routers
  - ADD to appRouter: progress, calendar, settings

Task 6 - Create Progress Page:
CREATE src/app/progress/page.tsx:
  - USE pattern from src/app/topics/page.tsx
  - IMPLEMENT milestone cards with status indicators
  - ADD research log form with file upload
  - USE Recharts for Gantt chart visualization
  - IMPLEMENT 4-week summary modal

Task 7 - Create Calendar Page:
CREATE src/app/calendar/page.tsx:
  - USE existing src/components/ui/calendar.tsx component
  - ADD event creation dialog
  - IMPLEMENT view switching (month/week/day)
  - INTEGRATE milestone deadlines
  - ADD event filtering by type

Task 8 - Create Settings Page:
CREATE src/app/settings/page.tsx:
  - USE tabs/sidebar for section navigation
  - IMPLEMENT profile form with React Hook Form
  - ADD notification toggles
  - CREATE password change form
  - HANDLE role-specific settings
```

### Per Task Pseudocode

```typescript
// Task 2 - Progress Router Pseudocode
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, professorProcedure } from '@/server/api/trpc'
import { LogType, MilestoneStatus, AlertLevel } from '@prisma/client'

export const progressRouter = createTRPCRouter({
  submitResearchLog: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(50, '日志内容至少50字'),
      type: z.nativeEnum(LogType),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // PATTERN: Check if user is student on this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          students: { some: { id: ctx.session.user.id } }
        }
      })
      
      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '无权访问此项目' })
      }
      
      // PATTERN: Calculate week number for 4-week summaries
      const weekNumber = input.type === LogType.SUMMARY ? 
        Math.floor(weeksSinceProjectStart / 4) : undefined
      
      // PATTERN: Create log with transaction if updating milestone
      const log = await ctx.prisma.researchLog.create({
        data: { ...input, studentId: ctx.session.user.id, weekNumber }
      })
      
      return { success: true, message: '日志提交成功', log }
    }),

  getMilestones: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // PATTERN: Include relations for complete data
      return await ctx.prisma.projectMilestone.findMany({
        where: { projectId: input.projectId },
        include: {
          feedback: {
            include: { professor: { select: { name: true } } }
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    })
})

// Task 6 - Progress Page Pseudocode
'use client'

export default function ProgressPage() {
  // PATTERN: Authentication check (from topics/page.tsx)
  const { data: session, status } = useSession()
  if (!session) redirect('/login')
  
  // PATTERN: Role-based UI
  const isStudent = session.user.roles.includes('STUDENT')
  const isProfessor = session.user.roles.includes('PROFESSOR')
  
  // PATTERN: Data fetching with tRPC
  const { data: projects } = api.progress.getUserProjects.useQuery()
  const [selectedProject, setSelectedProject] = useState(projects?.[0]?.id)
  
  const { data: milestones } = api.progress.getMilestones.useQuery(
    { projectId: selectedProject },
    { enabled: !!selectedProject }
  )
  
  // PATTERN: Form with React Hook Form + Zod
  const form = useForm<ResearchLogInput>({
    resolver: zodResolver(researchLogSchema),
    defaultValues: { type: LogType.DAILY }
  })
  
  const submitLog = api.progress.submitResearchLog.useMutation({
    onSuccess: () => {
      toast({ title: '提交成功' })
      form.reset()
    }
  })
  
  return (
    <DashboardLayout>
      {/* PATTERN: Card-based layout */}
      <Card>
        <CardHeader>
          <CardTitle>研究进展</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Milestone timeline with status indicators */}
          {/* Research log form */}
          {/* Gantt chart visualization */}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
```

### Integration Points
```yaml
DATABASE:
  - migration: "npx prisma migrate dev --name add-progress-calendar-settings"
  - seed: Update prisma/seed.ts to include sample logs, events, settings
  
API ROOT:
  - add to: src/server/api/root.ts
  - pattern: |
    import { progressRouter } from './routers/progress'
    import { calendarRouter } from './routers/calendar'
    import { settingsRouter } from './routers/settings'
    
    export const appRouter = createTRPCRouter({
      // ... existing routers
      progress: progressRouter,
      calendar: calendarRouter,
      settings: settingsRouter,
    })
  
NAVIGATION:
  - verify: Links to /progress, /calendar, /settings already exist
  - check: src/components/layouts/dashboard-layout.tsx for nav items
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# After implementing each file, run:
npm run type-check              # TypeScript validation
npm run lint                    # ESLint checks

# Expected: No errors. Common fixes:
# - Missing 'use client' directive
# - Unused imports
# - Type mismatches with Prisma generated types
```

### Level 2: Database Migration
```bash
# After updating schema.prisma:
npx prisma migrate dev --name add-missing-pages-models
npx prisma generate            # Regenerate types

# Test migration:
npx prisma studio              # Verify new tables exist
```

### Level 3: Page Rendering
```bash
# Start development server:
npm run dev

# Test each page:
# 1. Navigate to http://localhost:3000/progress
#    Expected: Progress page loads without errors
# 2. Navigate to http://localhost:3000/calendar
#    Expected: Calendar page with calendar component
# 3. Navigate to http://localhost:3000/settings
#    Expected: Settings page with forms

# Check console for errors
# Verify authentication redirects work
```

### Level 4: API Testing
```bash
# Test tRPC endpoints through UI interactions:
# 1. Submit a research log
# 2. Create a calendar event
# 3. Update notification preferences

# Monitor network tab for:
# - Successful 200 responses
# - Proper error handling for validation failures
# - Correct data mutations
```

### Level 5: Role-Based Features
```bash
# Test with different user roles:
# 1. Login as STUDENT - verify can submit logs, view own progress
# 2. Login as PROFESSOR - verify can review progress, add feedback
# 3. Login as SECRETARY - verify can view all progress reports
# 4. Login as ADMIN - verify full access to all features

# Test accounts from seed data or create new ones
```

## Final Validation Checklist
- [ ] All TypeScript errors resolved: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Prisma migration successful: `npx prisma migrate dev`
- [ ] All three pages render without console errors
- [ ] Forms validate and submit successfully
- [ ] Role-based access control working correctly
- [ ] Chinese labels display properly
- [ ] Mobile responsive design verified
- [ ] Loading states show during data fetching
- [ ] Error states handle API failures gracefully

## Anti-Patterns to Avoid
- ❌ Don't create new authentication patterns - use existing NextAuth setup
- ❌ Don't skip 'use client' directive - all pages in this project are client components
- ❌ Don't hardcode Chinese text in components - keep it in the component for maintainability
- ❌ Don't create new UI component patterns - use existing shadcn/ui components
- ❌ Don't skip role checks in API routes - security is critical
- ❌ Don't use Server Components - project uses client components throughout
- ❌ Don't forget mobile responsiveness - use Tailwind responsive classes
- ❌ Don't cache real-time data pages - use force-dynamic for progress/calendar

## Testing Commands Summary
```bash
# Run after implementation:
npm run type-check && npm run lint && npm run dev

# Database:
npx prisma migrate dev
npx prisma studio

# Development:
npm run dev
# Then test all pages and features
```

---

## Implementation Confidence Score: 8.5/10

**Reasoning:**
- ✅ Complete pattern examples from existing codebase
- ✅ Clear database schema from requirements
- ✅ Established tRPC patterns to follow  
- ✅ UI components already available (calendar, forms, etc.)
- ✅ Authentication/authorization patterns clear
- ⚠️ No existing tests to validate against
- ⚠️ Complex features like Gantt charts may need iteration

The high confidence comes from having concrete patterns to follow and comprehensive requirements. The main challenges will be implementing complex visualizations and ensuring all role-based features work correctly.