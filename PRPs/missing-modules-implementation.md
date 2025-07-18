# PRP: HUST Research Management Platform - Missing Modules Implementation

**Confidence Score: 8/10**

## Overview
This PRP provides a comprehensive implementation plan for the missing modules in the HUST Research Management Platform. The implementation follows existing codebase patterns and leverages modern React/Next.js best practices.

## Context & Prerequisites

### Existing Codebase Reference
- **Authentication Pattern**: `/src/server/api/routers/auth.ts`
- **UI Form Pattern**: `/src/app/login/page.tsx`, `/src/app/register/page.tsx`
- **Dashboard Layout**: `/src/components/layouts/dashboard-layout.tsx`
- **Database Schema**: `/prisma/schema.prisma`
- **tRPC Setup**: `/src/server/api/trpc.ts`

### Required Dependencies to Install
```bash
# Form handling
npm install react-hook-form @hookform/resolvers

# Data tables
npm install @tanstack/react-table

# Charts (already installed: recharts)

# Rich text editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# File uploads
npm install uploadthing @uploadthing/react react-dropzone

# Date handling (already installed: date-fns)

# PDF generation
npm install @react-pdf/renderer

# Additional UI components
npx shadcn@latest add calendar toast progress breadcrumb separator command
```

## Implementation Blueprint

### Phase 1: Topic Management Module (High Priority)

#### 1.1 Database Schema Extension
```prisma
// Add to prisma/schema.prisma

enum ApplicationStatus {
  PENDING
  REVIEWING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model TopicApplication {
  id              String            @id @default(cuid())
  topicId         String
  studentId       String
  statement       String            @db.Text
  resumeUrl       String?
  status          ApplicationStatus @default(PENDING)
  professorNote   String?
  reviewedAt      DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  topic           Topic             @relation(fields: [topicId], references: [id])
  student         User              @relation(fields: [studentId], references: [id])
  
  @@unique([topicId, studentId])
  @@index([status])
}

// Update Topic model
model Topic {
  // ... existing fields
  applications    TopicApplication[]
  attachmentUrl   String?
  maxStudents     Int              @default(1)
  currentStudents Int              @default(0)
}
```

#### 1.2 tRPC Router Implementation
```typescript
// Create /src/server/api/routers/topicManagement.ts
// Following pattern from auth.ts

export const topicManagementRouter = createTRPCRouter({
  // Professor procedures
  createTopic: professorProcedure
    .input(
      z.object({
        title: z.string().min(5, '标题至少5个字符'),
        description: z.string().min(20, '描述至少20个字符'),
        field: z.string(),
        prerequisites: z.string().optional(),
        expectedOutcome: z.string(),
        maxStudents: z.number().min(1).max(10),
        startDate: z.date(),
        endDate: z.date(),
        attachmentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation following auth.register pattern
    }),

  // Student procedures
  applyToTopic: protectedProcedure
    .input(
      z.object({
        topicId: z.string(),
        statement: z.string().min(100, '个人陈述至少100字'),
        resumeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if student role
      // Check if already applied
      // Create application
    }),

  // Shared procedures
  getTopics: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        field: z.string().optional(),
        status: z.enum(['RECRUITING', 'IN_PROGRESS', 'COMPLETED']).optional(),
        professorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Implement pagination pattern from existing routers
    }),
});
```

#### 1.3 UI Components

**Topic List Page** (`/src/app/topics/page.tsx`)
```typescript
// Follow pattern from dashboard/page.tsx
// Use shadcn/ui Card components for topic cards
// Implement filter sidebar with Select components
// Use @tanstack/react-table for list view option
```

**Topic Creation Form** (`/src/app/professor/topics/new/page.tsx`)
```typescript
// Follow pattern from register/page.tsx
// Use react-hook-form with zodResolver
// Integrate @tiptap/react for rich text description
// Use UploadThing for attachment upload
```

**Application Dialog** (`/src/components/features/topics/application-dialog.tsx`)
```typescript
// Use Dialog component from shadcn/ui
// Form with react-hook-form
// Statement field with character counter
// Resume upload with UploadThing
```

### Phase 2: Progress Tracking Module (High Priority)

#### 2.1 Database Schema
```prisma
// Add to schema.prisma

enum MilestoneStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  DELAYED
  BLOCKED
}

enum ReportType {
  WEEKLY
  MONTHLY
  MILESTONE
}

model Milestone {
  id          String          @id @default(cuid())
  projectId   String
  name        String
  description String?
  plannedDate DateTime
  actualDate  DateTime?
  progress    Int             @default(0)
  status      MilestoneStatus @default(NOT_STARTED)
  order       Int
  
  project     Project         @relation(fields: [projectId], references: [id])
  @@index([projectId, order])
}

model ProgressReport {
  id          String     @id @default(cuid())
  projectId   String
  milestoneId String?
  content     String     @db.Text
  attachments Json?
  reportType  ReportType
  feedback    String?    @db.Text
  createdAt   DateTime   @default(now())
  
  project     Project    @relation(fields: [projectId], references: [id])
  milestone   Milestone? @relation(fields: [milestoneId], references: [id])
}
```

#### 2.2 Progress Visualization Components

**Gantt Chart** (`/src/components/features/progress/gantt-chart.tsx`)
```typescript
// Use Recharts BarChart with custom rendering
// Reference: https://recharts.org/en-US/examples/CustomActiveShapePieChart
// Follow shadcn/ui chart patterns
```

**Progress Timeline** (`/src/components/features/progress/timeline.tsx`)
```typescript
// Custom component with Tailwind CSS
// Vertical timeline with milestone markers
// Color coding: green (completed), yellow (in progress), red (delayed)
```

### Phase 3: Achievement System (Medium Priority)

#### 3.1 Achievement Upload Form
```typescript
// Use multi-step form pattern
// Step 1: Type selection (Paper/Patent/Award/Software)
// Step 2: Details form (dynamic based on type)
// Step 3: File upload and co-authors
// Step 4: Review and submit
```

### Phase 4: Data Visualization Dashboard

#### 4.1 Student Dashboard Components
```typescript
// Research Radar Chart - using Recharts RadarChart
// Progress Timeline - custom component
// Achievement Stats - shadcn/ui Card with statistics
// Task Calendar - integrate react-day-picker
```

#### 4.2 Professor Dashboard
```typescript
// Student Overview Table - @tanstack/react-table
// Multi-project Gantt - extended Gantt component
// Alert Panel - custom component with filters
```

## External Documentation References

1. **React Hook Form + Zod**
   - Official docs: https://react-hook-form.com/
   - Zod integration: https://github.com/react-hook-form/resolvers#zod
   - Next.js example: https://github.com/react-hook-form/react-hook-form/tree/master/examples/V7/nextjs

2. **TanStack Table**
   - Official docs: https://tanstack.com/table/latest
   - shadcn/ui integration: https://ui.shadcn.com/docs/components/data-table
   - Filtering example: https://tanstack.com/table/latest/docs/framework/react/examples/filters

3. **Recharts**
   - Official docs: https://recharts.org/
   - shadcn/ui charts: https://ui.shadcn.com/docs/components/chart
   - Responsive examples: https://recharts.org/en-US/examples/ResponsiveContainer

4. **Tiptap Editor**
   - Next.js setup: https://tiptap.dev/docs/editor/getting-started/install/nextjs
   - Extensions: https://tiptap.dev/docs/editor/extensions
   - Collaboration: https://tiptap.dev/docs/editor/collaborative-editing

5. **UploadThing**
   - Quick start: https://docs.uploadthing.com/getting-started/appdir
   - React hooks: https://docs.uploadthing.com/api-reference/react
   - File validation: https://docs.uploadthing.com/concepts/file-types

## Implementation Tasks (In Order)

### Week 1: Topic Management
1. [ ] Extend Prisma schema with TopicApplication model
2. [ ] Run database migration
3. [ ] Create topicManagement.ts router with CRUD operations
4. [ ] Add router to root.ts
5. [ ] Create topics list page with filtering
6. [ ] Implement topic card component
7. [ ] Create topic detail page
8. [ ] Implement topic creation form (professor)
9. [ ] Create application dialog component
10. [ ] Implement application review interface
11. [ ] Add notification triggers
12. [ ] Write unit tests for router

### Week 2: Progress Tracking
1. [ ] Extend schema with Milestone and ProgressReport
2. [ ] Create progress router
3. [ ] Implement milestone management UI
4. [ ] Create Gantt chart component
5. [ ] Build progress timeline
6. [ ] Implement report submission form
7. [ ] Create alert system logic
8. [ ] Build professor feedback interface
9. [ ] Add email notifications
10. [ ] Test milestone status transitions

### Week 3: Achievement & Evaluation
1. [ ] Create achievement schema and router
2. [ ] Build multi-step achievement form
3. [ ] Implement verification workflow
4. [ ] Create achievement showcase page
5. [ ] Build evaluation framework
6. [ ] Implement score calculation engine
7. [ ] Create evaluation reports

### Week 4: Dashboards & Polish
1. [ ] Build student dashboard with all widgets
2. [ ] Create professor management dashboard
3. [ ] Implement secretary statistics view
4. [ ] Build admin analytics
5. [ ] Add loading states everywhere
6. [ ] Implement error boundaries
7. [ ] Add success toasts
8. [ ] Mobile responsiveness check
9. [ ] Performance optimization
10. [ ] Final testing

## Validation Gates

### After Each Module Implementation
```bash
# TypeScript & Linting
npm run typecheck
npm run lint

# Test database operations
npm run dev
# Manually test all CRUD operations

# Check for responsive design
# Test on viewport widths: 375px, 768px, 1024px, 1440px

# Authentication/Authorization
# Test each role can only access allowed features

# Performance check
# Ensure page loads < 3s
# Check bundle size: npm run build
```

### Before Final Deployment
```bash
# Full build test
npm run build
npm start

# Database integrity
npx prisma migrate deploy
npx prisma db seed

# Security audit
npm audit

# Accessibility check
# Use axe DevTools extension

# Cross-browser testing
# Test on Chrome, Firefox, Safari, Edge
```

## Error Handling Strategy

1. **API Errors**: Use tRPC's built-in error codes
   ```typescript
   throw new TRPCError({
     code: 'NOT_FOUND',
     message: '课题不存在',
   });
   ```

2. **Form Errors**: Display inline with fields
   ```typescript
   {errors.title && (
     <p className="text-sm text-red-500">{errors.title.message}</p>
   )}
   ```

3. **Loading States**: Use consistent Skeleton components
   ```typescript
   if (isLoading) return <TopicCardSkeleton />
   ```

4. **Empty States**: Helpful messages with actions
   ```typescript
   <EmptyState
     title="暂无课题"
     description="等待导师发布新课题"
     action={<Button>浏览其他课题</Button>}
   />
   ```

## Common Gotchas to Avoid

1. **Client Components**: Add 'use client' for forms and interactive components
2. **Date Handling**: Always use date-fns for formatting Chinese dates
3. **File Size**: Limit uploads to 10MB for Vercel compatibility
4. **Prisma Relations**: Use include/select carefully to avoid N+1 queries
5. **tRPC Mutations**: Return success messages for user feedback
6. **Role Checking**: Always verify roles server-side, not just client-side
7. **Chinese Text**: Use consistent terminology from existing UI

## Success Metrics

- All high-priority modules fully functional
- Zero TypeScript errors
- Page load times < 3 seconds
- Mobile responsive on all pages
- Role-based access properly enforced
- All forms have proper validation
- Success/error messages are clear
- Data visualizations are interactive

---

**Note**: This PRP provides a clear path to implement the missing modules. Follow the existing patterns in the codebase, reference the external documentation when needed, and test thoroughly after each module completion.