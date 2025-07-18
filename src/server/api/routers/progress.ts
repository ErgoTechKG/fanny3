import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const progressRouter = createTRPCRouter({
  // TODO: Implement progress routes
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    return []
  }),
})