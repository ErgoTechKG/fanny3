import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const achievementRouter = createTRPCRouter({
  // TODO: Implement achievement routes
  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    return []
  }),
})