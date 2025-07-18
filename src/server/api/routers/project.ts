import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const projectRouter = createTRPCRouter({
  // TODO: Implement project routes
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    return []
  }),
})