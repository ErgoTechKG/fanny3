import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const evaluationRouter = createTRPCRouter({
  // TODO: Implement evaluation routes
  getMyEvaluations: protectedProcedure.query(async ({ ctx }) => {
    return []
  }),
})