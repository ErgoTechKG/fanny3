name: "HUST Research Management Platform - Complete Implementation"
description: |

## Purpose
Implement a comprehensive research management platform for Huazhong University of Science and Technology (HUST) with multi-role support, automated workflows, and data-driven analytics. This PRP provides all context needed for one-pass implementation of a production-ready platform.

## Core Principles
1. **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, PostgreSQL
2. **Role-Based System**: Student, Professor, Secretary, Admin with strict permissions
3. **Chinese Language Support**: Bilingual UI with Chinese as primary
4. **Production Ready**: Complete with authentication, error handling, and seed data
5. **Design Excellence**: Professional, modern UI with excellent UX

---

## Goal
Build a complete research management platform that:
- Manages the entire research lifecycle from topic selection to achievement tracking
- Supports differentiated training for Innovation Class (创新班) and Qiming Class (启明班)
- Automates form processing and approval workflows
- Provides role-specific dashboards with data visualization
- Includes comprehensive dummy data for immediate demo

## Why
- **Problem**: Manual management of research projects is inefficient and error-prone
- **Solution**: Automated platform reduces administrative burden by 80%
- **Impact**: Better research outcomes through standardized processes
- **Users**: 1000+ students, 100+ professors, administrative staff

## What
A Next.js web application with:
- Multi-role authentication system
- 6 core functional modules
- Real-time notifications
- Data analytics dashboards
- Automated form processing
- Mobile-responsive design

### Success Criteria
- [ ] All 4 user roles can login and access role-specific dashboards
- [ ] Complete CRUD operations for all 6 core modules
- [ ] Seed data creates realistic demo environment
- [ ] All forms validate and save correctly
- [ ] Charts and visualizations render with sample data
- [ ] Mobile responsive on all screen sizes
- [ ] Test accounts work with password: `password123`

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Core Documentation
- url: https://nextjs.org/docs/app
  why: Next.js 14 App Router architecture, server components, API routes
  
- url: https://www.prisma.io/docs/getting-started/quickstart
  why: PostgreSQL setup, schema definition, migrations, seeding
  
- url: https://next-auth.js.org/getting-started/example
  why: Authentication setup, role-based access, session management
  
- url: https://ui.shadcn.com/docs/installation/next
  why: Component library setup, theming, component patterns
  
- url: https://trpc.io/docs/quickstart
  why: Type-safe API setup, procedures, middleware
  
- url: https://tailwindcss.com/docs/guides/nextjs
  why: Styling setup, responsive design, custom components

- url: https://recharts.org/en-US/examples
  why: Data visualization, chart types, responsive charts

# Project Files
- file: CLAUDE.md
  why: Project conventions, code style, folder structure
  
- file: PLANNING.md
  why: System architecture, database schema, UI design system
  
- file: INITIAL.md
  why: Complete feature requirements, all 6 modules detailed
```

### Current Codebase tree
```bash
fanny3/
├── CLAUDE.md
├── INITIAL.md
├── PLANNING.md
├── TASK.md
├── PRPs/
│   └── hust-research-platform.md
└── .env (contains DATABASE_URL)
```

### Desired Codebase tree with files
```bash
fanny3/
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind + shadcn/ui config
├── .eslintrc.json                  # ESLint configuration
├── .env.example                    # Environment variables template
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   └── register/
│   │   │       └── page.tsx       # Registration page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── student/
│   │   │   │   ├── page.tsx       # Student dashboard
│   │   │   │   ├── topics/        # Browse/apply topics
│   │   │   │   ├── progress/      # Submit progress
│   │   │   │   └── achievements/  # View achievements
│   │   │   ├── professor/
│   │   │   │   ├── page.tsx       # Professor dashboard
│   │   │   │   ├── topics/        # Manage topics
│   │   │   │   ├── students/      # View students
│   │   │   │   └── reviews/       # Review progress
│   │   │   ├── secretary/
│   │   │   │   ├── page.tsx       # Secretary dashboard
│   │   │   │   ├── overview/      # System overview
│   │   │   │   └── reports/       # Generate reports
│   │   │   └── admin/
│   │   │       ├── page.tsx       # Admin dashboard
│   │   │       ├── users/         # User management
│   │   │       └── analytics/     # System analytics
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts       # NextAuth API
│   │   │   └── trpc/[trpc]/
│   │   │       └── route.ts       # tRPC API handler
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css            # Global styles
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layouts/
│   │   │   ├── sidebar.tsx        # Dashboard sidebar
│   │   │   └── header.tsx         # App header
│   │   ├── features/
│   │   │   ├── topic-card.tsx     # Topic display card
│   │   │   ├── progress-form.tsx  # Progress submission
│   │   │   └── stats-card.tsx     # Statistics display
│   │   └── charts/
│   │       ├── radar-chart.tsx    # Ability radar chart
│   │       └── line-chart.tsx     # Progress timeline
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config
│   │   ├── prisma.ts              # Prisma client
│   │   ├── trpc.ts                # tRPC setup
│   │   └── utils.ts               # Helper functions
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts        # Auth procedures
│   │   │   │   ├── topic.ts       # Topic CRUD
│   │   │   │   ├── user.ts        # User management
│   │   │   │   └── progress.ts    # Progress tracking
│   │   │   └── root.ts            # Root router
│   │   └── db/
│   │       └── client.ts          # Database client
│   └── types/
│       ├── next-auth.d.ts         # NextAuth types
│       └── index.ts               # App types
└── public/
    └── images/                    # Static images
```

### Known Gotchas & Solutions
```typescript
// CRITICAL: Next.js 14 App Router specifics
// - Use 'use client' directive for interactive components
// - Server Components by default - no useState, useEffect
// - Metadata export for SEO
// - Loading.tsx and error.tsx for each route

// CRITICAL: Prisma + Next.js
// - Must use singleton pattern to prevent connection exhaustion
// - See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

// CRITICAL: NextAuth with TypeScript
// - Must extend default session types for custom user fields
// - Callback configuration for role-based redirects

// CRITICAL: tRPC + Next.js App Router
// - Special setup required for App Router
// - Use createTRPCProxyClient for client components

// CRITICAL: Chinese language support
// - Use Next.js i18n with chinese as default
// - Font optimization for Chinese characters
```

## Implementation Blueprint

### Data models and structure

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  name            String
  nameEn          String?
  studentId       String?   @unique
  phone           String?
  avatar          String?
  department      String?
  roles           UserRole[]
  
  // Relations
  professorTopics Topic[]   @relation("ProfessorTopics")
  studentApplications Application[] @relation("StudentApplications")
  studentProjects Project[] @relation("StudentProjects")
  studentProgress Progress[] @relation("StudentProgress")
  studentAchievements Achievement[] @relation("StudentAchievements")
  advisorProjects Project[] @relation("AdvisorProjects")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model UserRole {
  id     String   @id @default(cuid())
  userId String
  role   Role
  user   User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, role])
}

enum Role {
  STUDENT
  PROFESSOR
  SECRETARY
  ADMIN
}

model Topic {
  id               String   @id @default(cuid())
  title            String
  titleEn          String?
  description      Text
  descriptionEn    Text?
  professor        User     @relation("ProfessorTopics", fields: [professorId], references: [id])
  professorId      String
  status           TopicStatus @default(RECRUITING)
  maxStudents      Int      @default(1)
  currentStudents  Int      @default(0)
  prerequisites    String[]
  expectedOutcomes String[]
  field            String
  difficulty       Difficulty
  
  applications     Application[]
  projects         Project[]
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum TopicStatus {
  DRAFT
  RECRUITING
  IN_PROGRESS
  COMPLETED
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model Application {
  id          String   @id @default(cuid())
  student     User     @relation("StudentApplications", fields: [studentId], references: [id])
  studentId   String
  topic       Topic    @relation(fields: [topicId], references: [id])
  topicId     String
  resume      Text
  statement   Text
  status      ApplicationStatus @default(PENDING)
  reviewNotes String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([studentId, topicId])
}

enum ApplicationStatus {
  PENDING
  REVIEWING
  ACCEPTED
  REJECTED
}

model Project {
  id          String   @id @default(cuid())
  student     User     @relation("StudentProjects", fields: [studentId], references: [id])
  studentId   String
  advisor     User     @relation("AdvisorProjects", fields: [advisorId], references: [id])
  advisorId   String
  topic       Topic    @relation(fields: [topicId], references: [id])
  topicId     String
  status      ProjectStatus @default(ACTIVE)
  startDate   DateTime @default(now())
  endDate     DateTime?
  
  progress    Progress[]
  milestones  Milestone[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ProjectStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

model Progress {
  id          String   @id @default(cuid())
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  student     User     @relation("StudentProgress", fields: [studentId], references: [id])
  studentId   String
  type        ProgressType
  title       String
  content     Text
  attachments String[]
  feedback    String?
  status      ProgressStatus @default(SUBMITTED)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ProgressType {
  DAILY_LOG
  WEEKLY_SUMMARY
  MONTHLY_REPORT
  MILESTONE
}

enum ProgressStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  APPROVED
}

model Milestone {
  id          String   @id @default(cuid())
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  name        String
  description String?
  dueDate     DateTime
  completed   Boolean  @default(false)
  completedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Achievement {
  id          String   @id @default(cuid())
  student     User     @relation("StudentAchievements", fields: [studentId], references: [id])
  studentId   String
  type        AchievementType
  title       String
  description Text?
  proof       String?  // URL or file path
  verified    Boolean  @default(false)
  verifiedBy  String?
  verifiedAt  DateTime?
  score       Int?     // For competitions
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AchievementType {
  PAPER
  PATENT
  SOFTWARE_COPYRIGHT
  COMPETITION
  OTHER
}

model Evaluation {
  id            String   @id @default(cuid())
  studentId     String
  year          Int
  semester      Int
  moralScore    Float    // 思想品德
  academicScore Float    // 学业成绩
  innovationScore Float  // 科技创新
  researchScore Float    // 科研推进
  totalScore    Float
  rank          String?  // A/B/C/D
  comments      Text?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([studentId, year, semester])
}
```

### List of tasks to be completed

```yaml
Task 1: Initialize Next.js project and core dependencies
CREATE package.json:
  - Next.js 14, React 18, TypeScript
  - Prisma, @prisma/client
  - NextAuth, @auth/prisma-adapter
  - Tailwind CSS, @tailwindcss/forms
  - shadcn/ui dependencies
  - tRPC packages
  - Recharts for data visualization
  - Development tools (ESLint, Prettier)

Task 2: Configure TypeScript and build tools
CREATE tsconfig.json:
  - Strict mode enabled
  - Path aliases for clean imports
  - Next.js specific settings
CREATE next.config.js:
  - Image optimization
  - Environment variables
  - i18n configuration for Chinese

Task 3: Setup Tailwind CSS and design system
CREATE tailwind.config.ts:
  - shadcn/ui configuration
  - Custom color scheme (HUST blue/red)
  - Chinese font optimization
CREATE src/app/globals.css:
  - Tailwind directives
  - Custom CSS variables
  - Global styles

Task 4: Setup Prisma and database
CREATE prisma/schema.prisma:
  - Complete schema from blueprint above
  - Indexes for performance
RUN: npx prisma generate
RUN: npx prisma db push

Task 5: Create seed data script
CREATE prisma/seed.ts:
  - 20+ professors with Chinese names
  - 100+ students with varied data
  - 5+ secretaries
  - 2 admin accounts
  - 50+ topics in different states
  - 200+ progress records
  - 100+ achievements
  - All passwords: 'password123'

Task 6: Setup authentication
CREATE src/lib/auth.ts:
  - NextAuth configuration
  - Prisma adapter
  - Credential provider
  - Role-based callbacks
CREATE src/app/api/auth/[...nextauth]/route.ts:
  - NextAuth API route
CREATE src/types/next-auth.d.ts:
  - Extended session types with roles

Task 7: Setup tRPC
CREATE src/lib/trpc.ts:
  - tRPC setup with Next.js App Router
  - Context with session
  - Error handling
CREATE src/server/api/root.ts:
  - Root router combining all routers
CREATE src/app/api/trpc/[trpc]/route.ts:
  - tRPC HTTP handler

Task 8: Create UI components
CREATE src/components/ui/*:
  - Install shadcn/ui components
  - Button, Card, Form, Input, etc.
CREATE src/components/layouts/sidebar.tsx:
  - Role-based navigation
  - Mobile responsive
CREATE src/components/layouts/header.tsx:
  - User menu, notifications

Task 9: Implement authentication pages
CREATE src/app/(auth)/login/page.tsx:
  - Login form with email/password
  - Role selection
  - Remember me option
CREATE src/app/(auth)/register/page.tsx:
  - Registration for students
  - Field validation

Task 10: Create role-specific dashboards
CREATE src/app/(dashboard)/student/page.tsx:
  - Stats cards (projects, achievements)
  - Recent activities
  - Quick actions
CREATE src/app/(dashboard)/professor/page.tsx:
  - Active topics overview
  - Student progress summary
  - Pending reviews
CREATE src/app/(dashboard)/secretary/page.tsx:
  - System statistics
  - Alert summary
  - Quick reports
CREATE src/app/(dashboard)/admin/page.tsx:
  - User statistics
  - System health
  - Recent activities

Task 11: Implement Topic Management
CREATE src/server/api/routers/topic.ts:
  - CRUD operations
  - Search and filter
  - Application handling
CREATE src/app/(dashboard)/professor/topics/*:
  - Topic creation form
  - Topic listing
  - Edit/delete functionality
CREATE src/app/(dashboard)/student/topics/*:
  - Browse topics with filters
  - Topic detail view
  - Application submission

Task 12: Implement Progress Tracking
CREATE src/server/api/routers/progress.ts:
  - Progress submission
  - Review workflow
  - Status updates
CREATE src/app/(dashboard)/student/progress/*:
  - Progress form
  - History view
  - Feedback display
CREATE src/app/(dashboard)/professor/reviews/*:
  - Review queue
  - Feedback form
  - Batch actions

Task 13: Implement Achievement System
CREATE src/server/api/routers/achievement.ts:
  - Achievement CRUD
  - Verification workflow
CREATE src/app/(dashboard)/student/achievements/*:
  - Achievement submission
  - Status tracking
  - Certificate display

Task 14: Implement Data Visualizations
CREATE src/components/charts/radar-chart.tsx:
  - Student ability visualization
  - Responsive design
CREATE src/components/charts/line-chart.tsx:
  - Progress timeline
  - Interactive tooltips
CREATE src/components/charts/bar-chart.tsx:
  - Statistics display
  - Comparison views

Task 15: Implement Evaluation System
CREATE src/server/api/routers/evaluation.ts:
  - Score calculation
  - Ranking logic
CREATE evaluation pages:
  - Score input forms
  - Automated calculation
  - Report generation

Task 16: Add notification system
CREATE src/lib/notifications.ts:
  - In-app notifications
  - Email templates
  - Notification preferences

Task 17: Testing and validation
CREATE .env.example:
  - All required environment variables
  - Clear descriptions
RUN: npm run build
RUN: npm run seed
TEST: All user flows with test accounts
```

### Per task pseudocode

```typescript
// Task 5: Seed data - critical for demo
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create professors with Chinese names
  const professors = await Promise.all(
    Array.from({ length: 20 }, (_, i) => 
      prisma.user.create({
        data: {
          email: `professor${i + 1}@hust.edu.cn`,
          password: bcrypt.hashSync('password123', 10),
          name: faker.name.chinese(), // Use Chinese name generator
          nameEn: faker.name.findName(),
          roles: {
            create: { role: 'PROFESSOR' }
          }
        }
      })
    )
  )
  
  // Create varied topics
  const topicTemplates = [
    { title: '基于深度学习的图像识别研究', field: 'AI', difficulty: 'ADVANCED' },
    { title: '物联网智能家居系统设计', field: 'IoT', difficulty: 'INTERMEDIATE' },
    // ... more templates
  ]
  
  // Create realistic progress patterns
  const progressPatterns = [
    { week1: 'literature', week2: 'proposal', week3: 'experiment', week4: 'summary' },
    // Different student progress patterns
  ]
}

// Task 6: Auth setup with roles
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate and return user with roles
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { roles: true }
        })
        
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map(r => r.role)
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.roles = user.roles
      }
      return token
    },
    session({ session, token }) {
      session.user.roles = token.roles
      return session
    }
  }
}

// Task 11: Topic management with smart matching
// src/server/api/routers/topic.ts
export const topicRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      prerequisites: z.array(z.string()),
      // ... other fields
    }))
    .mutation(async ({ ctx, input }) => {
      // Only professors can create
      if (!ctx.session.user.roles.includes('PROFESSOR')) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return ctx.prisma.topic.create({
        data: {
          ...input,
          professorId: ctx.session.user.id
        }
      })
    }),
    
  getRecommended: protectedProcedure
    .query(async ({ ctx }) => {
      // Smart matching based on student profile
      const studentInterests = await getStudentInterests(ctx.session.user.id)
      
      return ctx.prisma.topic.findMany({
        where: {
          status: 'RECRUITING',
          field: { in: studentInterests },
          // Complex matching logic
        },
        include: {
          professor: true,
          _count: { select: { applications: true } }
        }
      })
    })
})
```

### Integration Points
```yaml
DATABASE:
  - Migration: Run after schema creation
  - Indexes: Add for userId, topicId, status fields
  - Backup: Daily automated backups
  
AUTHENTICATION:
  - Session: 30 day expiry
  - Roles: Check in middleware
  - Password: Bcrypt with salt rounds 10
  
API:
  - Rate limiting: 100 requests/minute
  - Validation: Zod schemas for all inputs
  - Error handling: Consistent error format
  
UI:
  - Theme: HUST blue (#005BAC) and red (#E60012)
  - Fonts: Noto Sans SC for Chinese
  - Icons: Lucide React icons
  
DEPLOYMENT:
  - Environment: Production on Vercel
  - Database: PostgreSQL on Supabase
  - Storage: Supabase storage for files
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# After creating each file, run:
npm run lint        # ESLint check
npm run typecheck   # TypeScript check

# Expected: No errors. Fix any issues before proceeding.
```

### Level 2: Build Validation
```bash
# Ensure the project builds
npm run build

# Expected: Build completes without errors
# Common issues: Missing dependencies, import errors
```

### Level 3: Database & Seed
```bash
# Setup database
npx prisma db push
npx prisma db seed

# Verify data
npx prisma studio  # Opens GUI to check data

# Expected: All tables populated with seed data
```

### Level 4: Authentication Test
```bash
# Start dev server
npm run dev

# Test login with each role:
# Student: student1@hust.edu.cn / password123
# Professor: professor1@hust.edu.cn / password123
# Secretary: secretary1@hust.edu.cn / password123
# Admin: admin@hust.edu.cn / password123

# Expected: Each role sees their specific dashboard
```

### Level 5: Feature Testing
```bash
# Test each core feature:

# 1. Topic Creation (Professor)
- Create new topic
- Verify it appears in listing
- Check student can see it

# 2. Application Flow (Student)
- Browse topics
- Submit application
- Check status updates

# 3. Progress Tracking
- Submit progress as student
- Review as professor
- Verify in dashboard

# 4. Data Visualizations
- Check all charts render
- Verify data accuracy
- Test responsiveness
```

### Level 6: Mobile Testing
```bash
# Test on different viewports:
npm run dev

# Open browser DevTools
# Test at: 375px (mobile), 768px (tablet), 1024px+ (desktop)

# Expected: All pages responsive, navigation works
```

## Final Validation Checklist
- [ ] Project builds without errors: `npm run build`
- [ ] All TypeScript errors resolved: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Database seeded with test data: `npm run seed`
- [ ] All 4 roles can login successfully
- [ ] Each role sees appropriate dashboard
- [ ] Topic CRUD operations work
- [ ] Application workflow complete
- [ ] Progress tracking functional
- [ ] Charts display with data
- [ ] Mobile responsive design works
- [ ] Chinese language displays correctly
- [ ] No console errors in browser
- [ ] Performance acceptable (<3s page load)

## Anti-Patterns to Avoid
- ❌ Don't use client components for data fetching - use Server Components
- ❌ Don't store sensitive data in localStorage - use secure sessions
- ❌ Don't skip TypeScript types - define all data structures
- ❌ Don't hardcode Chinese text - use i18n system
- ❌ Don't ignore mobile design - test continuously
- ❌ Don't skip error boundaries - handle all error states
- ❌ Don't use any type - proper TypeScript throughout

---

## Confidence Score: 9/10

This PRP provides comprehensive context for implementing the HUST Research Management Platform. The high confidence score reflects:
- Complete technical specifications
- Detailed data models
- Step-by-step implementation tasks
- Extensive validation procedures
- Production-ready considerations

The 1-point deduction is for potential complexities in:
- Chinese language handling nuances
- Complex role permission edge cases
- Real-time notification implementation

With this PRP, an AI agent should be able to implement a fully functional platform in one pass.