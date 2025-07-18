# HUST Research Management Platform - System Architecture

## 🎯 Project Overview

**Project Name**: 华中科技大学科研管理平台 (HUST Research Management Platform)  
**Version**: 1.0.0  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, PostgreSQL, Prisma, NextAuth

### Vision
构建一个现代化、智能化的科研教育管理平台，支持启明班和创新班的差异化培养需求，实现科研过程的标准化管理和数据驱动决策。

### Core Principles
- **系统化**: 完整覆盖科研培养全流程
- **自动化**: 减少重复性工作，提高效率
- **简洁性**: 直观的用户界面，低学习成本
- **数据驱动**: 基于数据分析优化培养方案

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                          API Layer                           │
│                    (Next.js API Routes + tRPC)              │
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                     │
│                    (Services & Use Cases)                    │
├─────────────────────────────────────────────────────────────┤
│                      Data Access Layer                       │
│                        (Prisma ORM)                          │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
hust-research-platform/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── student/         # Student dashboard
│   │   │   ├── professor/       # Professor dashboard
│   │   │   ├── secretary/       # Secretary dashboard
│   │   │   └── admin/          # Admin dashboard
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth routes
│   │   │   └── trpc/           # tRPC routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layouts/           # Layout components
│   │   ├── features/          # Feature-specific components
│   │   └── charts/            # Data visualization
│   ├── lib/                   # Utilities and configs
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── utils.ts          # Helper functions
│   │   └── constants.ts      # App constants
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   ├── server/               # Server-side code
│   │   ├── api/             # tRPC routers
│   │   ├── db/              # Database queries
│   │   └── services/        # Business logic
│   └── styles/              # Global styles
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts             # Seed data script
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── tests/                  # Test files
└── docs/                   # Documentation
```

## 📊 Database Schema

### Core Tables

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  studentId String?  @unique
  phone     String?
  roles     Role[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id    String   @id
  name  RoleType
  users User[]
}

enum RoleType {
  STUDENT
  PROFESSOR
  SECRETARY
  ADMIN
}

model Topic {
  id          String      @id @default(cuid())
  title       String
  description String
  professor   User        @relation("ProfessorTopics")
  status      TopicStatus
  prerequisites String[]
  expectedOutcomes String[]
  applications Application[]
  createdAt   DateTime    @default(now())
}

model Application {
  id        String            @id @default(cuid())
  student   User              @relation("StudentApplications")
  topic     Topic
  resume    String
  statement String
  status    ApplicationStatus
  createdAt DateTime          @default(now())
}

model Progress {
  id        String   @id @default(cuid())
  project   Project
  student   User
  content   String
  type      ProgressType
  createdAt DateTime @default(now())
}

model Achievement {
  id          String          @id @default(cuid())
  student     User
  type        AchievementType
  title       String
  description String
  verified    Boolean         @default(false)
  createdAt   DateTime        @default(now())
}
```

## 🔐 Security Architecture

### Authentication Flow
1. User login with credentials
2. NextAuth validates and creates session
3. JWT token stored in httpOnly cookie
4. Role-based middleware checks permissions
5. Row-level security in database queries

### Permission Matrix
| Feature | Student | Professor | Secretary | Admin |
|---------|---------|-----------|-----------|-------|
| View Topics | ✓ | ✓ | ✓ | ✓ |
| Create Topics | - | ✓ | - | ✓ |
| Apply to Topics | ✓ | - | - | - |
| View All Students | - | Own | ✓ | ✓ |
| Manage Users | - | - | - | ✓ |
| View Analytics | Own | Own | All | All |

## 🎨 UI/UX Design System

### Design Tokens
```css
:root {
  /* Colors */
  --primary: #005BAC;      /* HUST Blue */
  --secondary: #E60012;    /* HUST Red */
  --background: #FAFAFA;
  --foreground: #1A1A1A;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
}
```

### Component Library
- **Base**: shadcn/ui components
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Icons**: Lucide Icons

## 🚀 Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

### Code Standards
1. **TypeScript**: Strict mode enabled
2. **Linting**: ESLint + Prettier
3. **Testing**: Jest + React Testing Library
4. **Commits**: Conventional commits
5. **PR Reviews**: Required before merge

### Performance Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **API Response**: < 200ms

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large screens */
2xl: 1536px /* Extra large */
```

### Mobile Considerations
- Touch-friendly UI elements (min 44px)
- Swipe gestures for navigation
- Offline capability for critical features
- Progressive Web App (PWA) support

## 🔄 API Design

### REST Endpoints
```
GET    /api/topics          # List topics
POST   /api/topics          # Create topic
GET    /api/topics/:id      # Get topic
PUT    /api/topics/:id      # Update topic
DELETE /api/topics/:id      # Delete topic

GET    /api/users/me        # Current user
GET    /api/users/:id       # User profile
PUT    /api/users/:id       # Update user

POST   /api/applications    # Submit application
GET    /api/applications    # List applications
PUT    /api/applications/:id # Update application
```

### tRPC Procedures
```typescript
// Type-safe API calls
export const appRouter = router({
  topic: {
    list: publicProcedure.query(),
    create: protectedProcedure.mutation(),
    apply: protectedProcedure.mutation(),
  },
  user: {
    profile: protectedProcedure.query(),
    updateProfile: protectedProcedure.mutation(),
  },
  analytics: {
    dashboard: protectedProcedure.query(),
    export: protectedProcedure.mutation(),
  },
});
```

## 📈 Monitoring & Analytics

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- User behavior analytics
- API usage metrics

### Business Metrics
- User engagement rates
- Topic completion rates
- Achievement growth trends
- System usage patterns

## 🚢 Deployment Strategy

### Infrastructure
- **Hosting**: Vercel (Next.js)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Storage**: Supabase Storage

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://...
NEXTAUTH_SECRET=...

# External Services
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
```

### CI/CD Pipeline
1. Push to GitHub
2. Run tests (GitHub Actions)
3. Build verification
4. Deploy to Vercel
5. Run E2E tests
6. Notify team

## 📝 Documentation

### User Documentation
- User guides for each role
- Video tutorials
- FAQ section
- API documentation

### Developer Documentation
- Setup instructions
- Architecture decisions
- Contribution guidelines
- Code examples

## 🎯 Milestones

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup
- [ ] Authentication system
- [ ] Basic UI components
- [ ] Database schema

### Phase 2: Core Features (Week 3-4)
- [ ] Topic management
- [ ] User dashboards
- [ ] Application system
- [ ] Progress tracking

### Phase 3: Advanced Features (Week 5-6)
- [ ] Analytics dashboards
- [ ] Automated forms
- [ ] Notification system
- [ ] Achievement system

### Phase 4: Polish & Deploy (Week 7-8)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User testing
- [ ] Deployment