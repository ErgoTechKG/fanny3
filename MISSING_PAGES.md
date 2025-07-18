# Missing Pages Documentation

## Overview
This document details the missing pages that need to be implemented in the HUST Research Management Platform. These pages were identified during testing and are referenced in various parts of the application.

## Missing Pages

### 1. Progress Page (`/progress`)
**Purpose**: Track and manage research progress for students and projects (项目进展监控模块)

**Required Features**:
- **科研日志系统** (Research Log System)
  - Daily/weekly research logs
  - 每4周提交进展小结 (Progress summary every 4 weeks)
- **标准化进度节点** (Standardized Progress Milestones):
  - 文献调研 (Literature Review)
  - 开题报告 (Proposal)
  - 实验设计 (Experiment Design)
  - 数据收集 (Data Collection)
  - 阶段总结 (Phase Summary)
  - 成果产出 (Results Output)
- **自动预警系统** (Automatic Alert System)
  - Red/Yellow/Green light indicators
  - 异常情况自动通知 (Automatic anomaly notifications)
- **进度可视化** (Progress Visualization)
  - Gantt chart implementation
  - Timeline view for each project
- **导师批注与反馈** (Professor Annotations & Feedback)
  - Inline comments on progress reports
  - Approval workflow for milestones
- Progress statistics and analytics
- File attachment support for progress documentation

**User Roles**:
- **Students**: Submit progress reports, view feedback
- **Professors**: Review progress, provide feedback, approve milestones
- **Secretary**: Monitor overall progress across projects
- **Admin**: System-wide progress analytics

**Key Components**:
- Progress timeline component
- Milestone card component
- Progress report form
- File upload integration
- Progress charts and visualizations

### 2. Calendar Page (`/calendar`)
**Purpose**: Centralized calendar for research-related events, deadlines, and meetings

**Required Features**:
- Monthly/Weekly/Daily calendar views
- Event creation and management
- **实验室轮转管理** (Lab Rotation Management) integration
  - Lab rotation scheduling
  - Rotation application deadlines
  - Lab visit appointments
- **里程碑截止日期** (Milestone Deadlines)
  - Auto-import from progress tracking module
  - Visual indicators for approaching deadlines
- Meeting scheduling between students and professors
  - Available time slots management
  - Meeting request workflow
- Defense date scheduling
- **项目节点提醒** (Project Node Reminders)
  - Integration with standardized progress nodes
  - Automatic reminder generation
- Event notifications
  - In-app notifications
  - Email reminders
  - 企业微信集成 (WeChat Work integration - optional)

**User Roles**:
- **Students**: View deadlines, schedule meetings
- **Professors**: Manage availability, schedule meetings
- **Secretary**: Manage defense schedules, department events
- **Admin**: System-wide event management

**Key Components**:
- Calendar view component (already exists in UI)
- Event creation dialog
- Event detail modal
- Reminder settings
- Calendar filters

### 3. Settings Page (`/settings`)
**Purpose**: User preferences and account management

**Required Features**:
- **个人信息管理** (Profile Information Management)
  - Basic info (name, email, phone, student ID)
  - Department/College information
  - Research interests/fields
  - Academic background
- Password change functionality
- **通知偏好设置** (Notification Preferences)
  - 站内通知 (In-app notifications) toggle
  - 邮件通知 (Email notifications) settings
  - 企业微信集成 (WeChat Work integration) settings
  - Notification frequency settings
- **消息中心设置** (Message Center Settings)
  - Message categories filter
  - Auto-archive settings
- Language settings (中文/English)
- Theme preferences (light/dark mode)
- **角色特定设置** (Role-specific Settings)
  - **Students**: Default lab preferences, mentor preferences
  - **Professors**: Office hours, student capacity limits
  - **Secretary**: Report generation preferences
  - **Admin**: System-wide notification settings
- Privacy settings
  - Profile visibility options
  - Data sharing preferences
- **表单自动化设置** (Form Automation Settings)
  - Default form templates
  - Auto-fill preferences

**User Roles**:
- **All Users**: Access to personal settings
- **Admin**: Additional system settings access

**Key Components**:
- Settings sidebar navigation
- Profile form
- Password change form
- Notification toggle switches
- Theme selector

## Technical Requirements

### Database Schema Updates
```prisma
// Add to existing schema

// For Progress Tracking
model ResearchLog {
  id          String   @id @default(cuid())
  studentId   String
  projectId   String
  content     String   @db.Text
  type        LogType  // DAILY, WEEKLY, MONTHLY
  weekNumber  Int?     // For 4-week summaries
  
  student     User     @relation(fields: [studentId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProjectMilestone {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  type        MilestoneType // LITERATURE_REVIEW, PROPOSAL, EXPERIMENT_DESIGN, etc.
  status      MilestoneStatus // PENDING, IN_PROGRESS, COMPLETED, DELAYED
  alertLevel  AlertLevel // GREEN, YELLOW, RED
  dueDate     DateTime
  completedAt DateTime?
  
  project     Project  @relation(fields: [projectId], references: [id])
  feedback    ProfessorFeedback[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProfessorFeedback {
  id          String   @id @default(cuid())
  milestoneId String
  professorId String
  content     String   @db.Text
  approved    Boolean  @default(false)
  
  milestone   ProjectMilestone @relation(fields: [milestoneId], references: [id])
  professor   User     @relation(fields: [professorId], references: [id])
  
  createdAt   DateTime @default(now())
}

// For Calendar
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  startTime   DateTime
  endTime     DateTime
  location    String?
  type        EventType
  createdById String
  projectId   String?
  labRotationId String?
  
  createdBy   User     @relation(fields: [createdById], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])
  labRotation LabRotation? @relation(fields: [labRotationId], references: [id])
  attendees   EventAttendee[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model EventAttendee {
  id       String @id @default(cuid())
  eventId  String
  userId   String
  status   AttendeeStatus @default(PENDING)
  
  event    Event  @relation(fields: [eventId], references: [id])
  user     User   @relation(fields: [userId], references: [id])
  
  @@unique([eventId, userId])
}

// For Settings
model UserSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  emailNotifications Boolean @default(true)
  pushNotifications Boolean  @default(false)
  wechatNotifications Boolean @default(false)
  notificationFrequency NotificationFrequency @default(IMMEDIATE)
  theme            Theme     @default(LIGHT)
  language         String    @default("zh-CN")
  timezone         String    @default("Asia/Shanghai")
  
  // Role-specific settings stored as JSON
  roleSettings     Json?     // e.g., office hours, student capacity, etc.
  formPreferences  Json?     // Form automation preferences
  
  user             User      @relation(fields: [userId], references: [id])
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

// Enums
enum LogType {
  DAILY
  WEEKLY
  MONTHLY
  SUMMARY     // 4-week summary
}

enum MilestoneType {
  LITERATURE_REVIEW  // 文献调研
  PROPOSAL          // 开题报告
  EXPERIMENT_DESIGN // 实验设计
  DATA_COLLECTION   // 数据收集
  PHASE_SUMMARY     // 阶段总结
  RESULT_OUTPUT     // 成果产出
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DELAYED
  AT_RISK
}

enum AlertLevel {
  GREEN   // 正常
  YELLOW  // 警告
  RED     // 严重延迟
}

enum EventType {
  MEETING
  DEADLINE
  DEFENSE
  WORKSHOP
  LAB_ROTATION
  MILESTONE_DUE
  OTHER
}

enum AttendeeStatus {
  PENDING
  ACCEPTED
  DECLINED
  MAYBE
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

enum NotificationFrequency {
  IMMEDIATE
  DAILY
  WEEKLY
  NEVER
}
```

### API Routes Required

1. **Progress Router** (`/src/server/api/routers/progress.ts`):
   - `getProjectProgress` - Get progress overview with milestones
   - `getResearchLogs` - Fetch research logs (daily/weekly/monthly)
   - `submitResearchLog` - Submit daily/weekly research log
   - `submit4WeekSummary` - Submit 4-week progress summary
   - `getMilestones` - Get project milestones with status
   - `updateMilestone` - Update milestone status
   - `submitMilestoneFeedback` - Professor submits feedback
   - `approveMilestone` - Professor approves milestone
   - `getProgressAlerts` - Get red/yellow/green alerts
   - `getProgressStats` - Get progress analytics
   - `generateGanttData` - Generate Gantt chart data

2. **Calendar Router** (`/src/server/api/routers/calendar.ts`):
   - `getEvents` - Get events with filters (type, date range, etc.)
   - `createEvent` - Create new event
   - `updateEvent` - Update event details
   - `deleteEvent` - Delete event
   - `updateAttendeeStatus` - Accept/decline event invitation
   - `getLabRotationSchedule` - Get lab rotation calendar
   - `scheduleMeeting` - Request meeting with professor
   - `getProfessorAvailability` - Get professor's available slots
   - `importMilestoneDeadlines` - Import deadlines from progress module
   - `getUpcomingDeadlines` - Get upcoming milestone deadlines
   - `setEventReminder` - Configure event reminders

3. **Settings Router** (`/src/server/api/routers/settings.ts`):
   - `getUserSettings` - Get all user settings
   - `updateUserSettings` - Update general settings
   - `updateNotificationPreferences` - Update notification settings
   - `updateRoleSpecificSettings` - Update role-based settings
   - `changePassword` - Change user password
   - `updateProfile` - Update profile information
   - `updateFormPreferences` - Update form automation preferences
   - `getNotificationCategories` - Get available notification types
   - `testNotificationSettings` - Send test notification
   - `exportUserData` - Export user data for privacy

## Implementation Priority

1. **High Priority**: Progress Page
   - Critical for research project tracking
   - Required for milestone management
   - Impacts student evaluation

2. **Medium Priority**: Calendar Page
   - Important for scheduling
   - Enhances coordination
   - Improves deadline management

3. **Low Priority**: Settings Page
   - Quality of life improvement
   - Can use defaults initially
   - Not critical for core functionality

## UI/UX Considerations

- Maintain consistency with existing design patterns
- Use shadcn/ui components throughout
- Ensure responsive design for all pages
- Follow existing color scheme and typography
- Implement proper loading and error states

## Testing Requirements

- Unit tests for all new API routes
- Component tests for key UI elements
- Integration tests for workflows
- Accessibility testing for all pages
- Performance testing for calendar with many events

## Estimated Development Time

- Progress Page: 3-4 days
- Calendar Page: 2-3 days
- Settings Page: 1-2 days
- Testing and Integration: 2 days

Total: ~10 days for full implementation

## Dependencies

- Calendar page can leverage existing `/src/components/ui/calendar.tsx`
- Progress page may need chart libraries (already have Recharts)
- Settings page is mostly forms (use existing patterns)

## Next Steps

1. Create GitHub issue for tracking
2. Prioritize based on user needs
3. Create detailed component designs
4. Implement in priority order
5. Add comprehensive tests
6. Update documentation