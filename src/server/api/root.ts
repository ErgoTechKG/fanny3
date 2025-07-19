import { createTRPCRouter } from '@/server/api/trpc'
import { authRouter } from '@/server/api/routers/auth'
import { userRouter } from '@/server/api/routers/user'
import { topicRouter } from '@/server/api/routers/topic'
import { topicManagementRouter } from '@/server/api/routers/topicManagement'
import { applicationRouter } from '@/server/api/routers/application'
import { projectRouter } from '@/server/api/routers/project'
import { progressRouter } from '@/server/api/routers/progress'
import { achievementRouter } from '@/server/api/routers/achievement'
import { evaluationRouter } from '@/server/api/routers/evaluation'
import { dashboardRouter } from '@/server/api/routers/dashboard'
import { calendarRouter } from '@/server/api/routers/calendar'
import { settingsRouter } from '@/server/api/routers/settings'
import { mentorRouter } from '@/server/api/routers/mentor'
import { labRouter } from '@/server/api/routers/lab'
import { formRouter } from '@/server/api/routers/form'
import { importRouter } from '@/server/api/routers/import'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  topic: topicRouter,
  topicManagement: topicManagementRouter,
  application: applicationRouter,
  project: projectRouter,
  progress: progressRouter,
  achievement: achievementRouter,
  evaluation: evaluationRouter,
  dashboard: dashboardRouter,
  calendar: calendarRouter,
  settings: settingsRouter,
  mentor: mentorRouter,
  lab: labRouter,
  form: formRouter,
  import: importRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter