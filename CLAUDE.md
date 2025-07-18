# HUST Research Management Platform - Project Guidelines

## 🌐 Tech Stack & Environment
- **For Python**: Use venv (virtual environment), don't mess with local environment
- **Primary Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, PostgreSQL
- **Database**: PostgreSQL (credentials in .env) - use Prisma ORM
- **Authentication**: NextAuth.js with role-based access control
- **UI Components**: shadcn/ui for consistent, modern design
- **State Management**: Zustand for client-side state
- **Data Fetching**: Server Components + tRPC for type-safe APIs

### 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Next.js Project Structure**:
  ```
  src/
  ├── app/                 # App Router pages and layouts
  │   ├── (auth)/         # Auth group (login, register)
  │   ├── (dashboard)/    # Dashboard group by role
  │   ├── api/            # API routes
  │   └── globals.css     # Global styles
  ├── components/         # Reusable UI components
  │   ├── ui/            # shadcn/ui components
  │   └── features/      # Feature-specific components
  ├── lib/               # Utilities and configs
  │   ├── prisma.ts      # Prisma client
  │   └── auth.ts        # NextAuth config
  ├── hooks/             # Custom React hooks
  ├── types/             # TypeScript type definitions
  └── server/            # Server-side code
      ├── api/           # tRPC routers
      └── db/            # Database queries
  ```
- **Use environment variables** from `.env` for sensitive data
- **Follow Next.js conventions** for file naming and routing

### 🧪 Testing & Reliability
- **For Next.js**: Use Jest and React Testing Library for unit tests
- **For API routes**: Use integration tests with test database
- **Test structure**:
  ```
  __tests__/
  ├── unit/           # Unit tests for components/functions
  ├── integration/    # API and database tests
  └── e2e/           # End-to-end tests (Playwright)
  ```
- **Test requirements**:
  - Component tests for all UI components
  - API route tests with different user roles
  - Database migration tests
  - Authentication flow tests

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions
- **TypeScript** for all code - strict mode enabled
- **Code Style**:
  - Use ESLint and Prettier for consistent formatting
  - Follow React/Next.js best practices
  - Use async/await over promises
  - Prefer functional components with hooks
- **Component Guidelines**:
  ```tsx
  // Use this pattern for components
  interface ComponentProps {
    // Always define prop types
  }
  
  export function Component({ prop }: ComponentProps) {
    // Implementation
  }
  ```
- **Database Queries**: Use Prisma with type-safe queries
- **API Design**: RESTful principles with tRPC for type safety

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

### 🎨 UI/UX Design Principles
- **Modern & Professional**: Clean, minimalist design with good use of whitespace
- **Responsive**: Mobile-first approach, works on all screen sizes
- **Accessible**: Follow WCAG guidelines, proper ARIA labels
- **Consistent**: Use design tokens for colors, spacing, typography
- **Visual Hierarchy**: Clear information architecture
- **Data Visualization**: Use Recharts for charts and graphs
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages

### 👥 Role-Based System
- **Four Main Roles**:
  1. **Student (学生)**: Research participation, progress tracking
  2. **Professor/Advisor (导师)**: Topic publishing, student guidance
  3. **Research Secretary (科研秘书)**: Administrative tasks, monitoring
  4. **Admin (管理员)**: System management, analytics
- **Permission Matrix**: Strict role-based access control
- **Role Switching**: Support users with multiple roles
- **Dashboard Customization**: Role-specific dashboards

### 📊 Data Requirements
- **Dummy Data Generation**:
  - Create realistic Chinese names for users
  - Generate research topics in various fields
  - Include progress records at different stages
  - Add sample achievements and evaluations
- **Data Seeding**: Prisma seed script for initial data
- **Demo Accounts**: One test account per role for demo

### 🔐 Security & Privacy
- **Authentication**: Secure session management with NextAuth
- **Authorization**: Row-level security in database
- **Data Protection**: Encrypt sensitive information
- **Audit Logging**: Track all important actions
- **GDPR Compliance**: Data export and deletion capabilities