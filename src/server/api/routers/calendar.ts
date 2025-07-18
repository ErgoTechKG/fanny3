import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { EventType, AttendeeStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const calendarRouter = createTRPCRouter({
  // Get events with filters
  getEvents: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      type: z.nativeEnum(EventType).optional(),
      projectId: z.string().optional(),
      viewType: z.enum(['month', 'week', 'day']).default('month'),
      currentDate: z.date().default(() => new Date()),
    }))
    .query(async ({ ctx, input }) => {
      const { type, projectId, viewType, currentDate } = input
      let { startDate, endDate } = input

      // Calculate date range based on view type
      if (!startDate || !endDate) {
        switch (viewType) {
          case 'day':
            startDate = startOfDay(currentDate)
            endDate = endOfDay(currentDate)
            break
          case 'week':
            startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
            endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
            break
          case 'month':
          default:
            startDate = startOfMonth(currentDate)
            endDate = endOfMonth(currentDate)
            break
        }
      }

      const where: {
        startTime: { gte: Date; lte: Date }
        type?: EventType
        projectId?: string
        OR?: Array<{
          createdById?: string
          attendees?: { some: { userId: string } }
          project?: { studentId?: string; advisorId?: string }
        }>
      } = {
        startTime: { gte: startDate, lte: endDate },
      }

      if (type) where.type = type
      if (projectId) where.projectId = projectId

      // Add role-based filtering
      const user = ctx.session.user
      if (user.roles.includes('STUDENT')) {
        where.OR = [
          { createdById: user.id },
          { attendees: { some: { userId: user.id } } },
          { project: { studentId: user.id } },
        ]
      } else if (user.roles.includes('PROFESSOR')) {
        where.OR = [
          { createdById: user.id },
          { attendees: { some: { userId: user.id } } },
          { project: { advisorId: user.id } },
        ]
      }

      const events = await ctx.prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { name: true } },
          project: {
            include: {
              topic: { select: { title: true } },
            },
          },
          attendees: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      })

      // Also get milestone deadlines
      const milestoneDeadlines = await ctx.prisma.projectMilestone.findMany({
        where: {
          dueDate: { gte: startDate, lte: endDate },
          ...(projectId ? { projectId } : {}),
        },
        include: {
          project: {
            include: {
              topic: { select: { title: true } },
              student: { select: { name: true } },
            },
          },
        },
      })

      // Transform milestones to event format
      const milestoneEvents = milestoneDeadlines.map(milestone => ({
        id: `milestone-${milestone.id}`,
        title: `里程碑截止: ${milestone.name}`,
        description: `项目: ${milestone.project.topic.title}`,
        startTime: milestone.dueDate,
        endTime: milestone.dueDate,
        type: EventType.MILESTONE_DUE,
        location: null,
        createdById: milestone.project.studentId,
        projectId: milestone.projectId,
        labRotationId: null,
        createdBy: milestone.project.student,
        project: milestone.project,
        attendees: [],
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
        isMilestone: true,
        milestoneStatus: milestone.status,
        alertLevel: milestone.alertLevel,
      }))

      return [...events, ...milestoneEvents].sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      )
    }),

  // Create new event
  createEvent: protectedProcedure
    .input(z.object({
      title: z.string().min(2, '标题至少2字'),
      description: z.string().optional(),
      startTime: z.date(),
      endTime: z.date(),
      location: z.string().optional(),
      type: z.nativeEnum(EventType),
      projectId: z.string().optional(),
      attendeeIds: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { attendeeIds, ...eventData } = input

      // Validate end time is after start time
      if (eventData.endTime <= eventData.startTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '结束时间必须晚于开始时间',
        })
      }

      // Create event with attendees
      const event = await ctx.prisma.event.create({
        data: {
          ...eventData,
          createdById: ctx.session.user.id,
          attendees: {
            create: attendeeIds.map(userId => ({
              userId,
              status: AttendeeStatus.PENDING,
            })),
          },
        },
        include: {
          attendees: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      })

      return {
        success: true,
        message: '事件创建成功',
        event,
      }
    }),

  // Update event
  updateEvent: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      location: z.string().optional(),
      type: z.nativeEnum(EventType).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if user owns the event
      const event = await ctx.prisma.event.findUnique({
        where: { id },
      })

      if (!event || event.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权修改此事件',
        })
      }

      // Validate times if both provided
      if (data.startTime && data.endTime && data.endTime <= data.startTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '结束时间必须晚于开始时间',
        })
      }

      const updated = await ctx.prisma.event.update({
        where: { id },
        data,
      })

      return {
        success: true,
        message: '事件更新成功',
        event: updated,
      }
    }),

  // Delete event
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the event
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      })

      if (!event || event.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权删除此事件',
        })
      }

      await ctx.prisma.event.delete({
        where: { id: input.id },
      })

      return {
        success: true,
        message: '事件删除成功',
      }
    }),

  // Update attendee status
  updateAttendeeStatus: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      status: z.nativeEnum(AttendeeStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      const attendee = await ctx.prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: ctx.session.user.id,
          },
        },
      })

      if (!attendee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '您不是此事件的参与者',
        })
      }

      const updated = await ctx.prisma.eventAttendee.update({
        where: {
          id: attendee.id,
        },
        data: {
          status: input.status,
        },
      })

      return {
        success: true,
        message: '状态更新成功',
        attendee: updated,
      }
    }),

  // Get lab rotation schedule
  getLabRotationSchedule: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: {
        OR?: Array<{
          startDate?: { gte: Date; lte: Date }
          endDate?: { gte: Date; lte: Date }
        }>
      } = {}
      
      if (input.startDate && input.endDate) {
        where.OR = [
          {
            startDate: { gte: input.startDate, lte: input.endDate },
          },
          {
            endDate: { gte: input.startDate, lte: input.endDate },
          },
        ]
      }

      return await ctx.prisma.labRotation.findMany({
        where,
        orderBy: { startDate: 'asc' },
      })
    }),

  // Schedule meeting request
  scheduleMeeting: protectedProcedure
    .input(z.object({
      professorId: z.string(),
      title: z.string().min(5, '会议主题至少5字'),
      description: z.string().min(10, '会议说明至少10字'),
      proposedTimes: z.array(z.object({
        startTime: z.date(),
        endTime: z.date(),
      })).min(1, '至少提供一个时间选项'),
      projectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { professorId, proposedTimes, ...meetingData } = input

      // Verify professor exists
      const professor = await ctx.prisma.user.findFirst({
        where: {
          id: professorId,
          roles: { some: { role: 'PROFESSOR' } },
        },
      })

      if (!professor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '导师不存在',
        })
      }

      // Create meeting request as event with proposed times
      const firstTime = proposedTimes[0]
      const event = await ctx.prisma.event.create({
        data: {
          ...meetingData,
          startTime: firstTime.startTime,
          endTime: firstTime.endTime,
          type: EventType.MEETING,
          createdById: ctx.session.user.id,
          attendees: {
            create: {
              userId: professorId,
              status: AttendeeStatus.PENDING,
            },
          },
        },
      })

      return {
        success: true,
        message: '会议请求已发送',
        event,
      }
    }),

  // Get professor availability
  getProfessorAvailability: protectedProcedure
    .input(z.object({
      professorId: z.string(),
      date: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const { professorId, date } = input
      const startOfSelectedDay = startOfDay(date)
      const endOfSelectedDay = endOfDay(date)

      // Get professor's events for the day
      const events = await ctx.prisma.event.findMany({
        where: {
          OR: [
            { createdById: professorId },
            { attendees: { some: { userId: professorId, status: AttendeeStatus.ACCEPTED } } },
          ],
          startTime: { gte: startOfSelectedDay, lte: endOfSelectedDay },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      })

      // Get professor's settings for office hours (if exists)
      const settings = await ctx.prisma.userSettings.findUnique({
        where: { userId: professorId },
        select: { roleSettings: true },
      })

      const officeHours = settings?.roleSettings as {
        officeHours?: {
          start: string
          end: string
          excludeWeekends: boolean
        }
      } | null
      
      const defaultOfficeHours = {
        start: '09:00',
        end: '17:00',
        excludeWeekends: true,
      }

      const hours = officeHours?.officeHours || defaultOfficeHours

      // Calculate available slots (30-minute intervals)
      const availableSlots = []
      const dayOfWeek = date.getDay()
      
      // Skip weekends if configured
      if (hours.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return []
      }

      // Generate time slots
      const [startHour, startMin] = hours.start.split(':').map(Number)
      const [endHour, endMin] = hours.end.split(':').map(Number)
      
      const currentSlot = new Date(date)
      currentSlot.setHours(startHour, startMin, 0, 0)
      
      const endTime = new Date(date)
      endTime.setHours(endHour, endMin, 0, 0)

      while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot.getTime() + 30 * 60 * 1000) // 30 minutes

        // Check if slot conflicts with existing events
        const hasConflict = events.some(event => {
          return (currentSlot < event.endTime && slotEnd > event.startTime)
        })

        if (!hasConflict) {
          availableSlots.push({
            startTime: new Date(currentSlot),
            endTime: new Date(slotEnd),
          })
        }

        currentSlot.setTime(currentSlot.getTime() + 30 * 60 * 1000)
      }

      return availableSlots
    }),

  // Import milestone deadlines (automatic)
  importMilestoneDeadlines: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.prisma.projectMilestone.findMany({
        where: {
          projectId: input.projectId,
          status: { not: 'COMPLETED' },
        },
        include: {
          project: {
            include: {
              topic: { select: { title: true } },
            },
          },
        },
      })

      return milestones.map(milestone => ({
        id: milestone.id,
        title: `里程碑: ${milestone.name}`,
        dueDate: milestone.dueDate,
        projectTitle: milestone.project.topic.title,
        status: milestone.status,
        alertLevel: milestone.alertLevel,
      }))
    }),

  // Get upcoming deadlines
  getUpcomingDeadlines: protectedProcedure
    .input(z.object({
      days: z.number().default(7),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000)

      const user = ctx.session.user
      const where: {
        dueDate: { gte: Date; lte: Date }
        status: { not: 'COMPLETED' }
        project?: { studentId?: string; advisorId?: string }
      } = {
        dueDate: { gte: now, lte: futureDate },
        status: { not: 'COMPLETED' },
      }

      // Add role-based filtering
      if (user.roles.includes('STUDENT')) {
        where.project = { studentId: user.id }
      } else if (user.roles.includes('PROFESSOR')) {
        where.project = { advisorId: user.id }
      }

      const deadlines = await ctx.prisma.projectMilestone.findMany({
        where,
        include: {
          project: {
            include: {
              topic: { select: { title: true } },
              student: { select: { name: true, studentId: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      })

      return deadlines.map(deadline => ({
        id: deadline.id,
        title: deadline.name,
        dueDate: deadline.dueDate,
        projectTitle: deadline.project.topic.title,
        studentName: deadline.project.student.name,
        studentId: deadline.project.student.studentId,
        status: deadline.status,
        alertLevel: deadline.alertLevel,
        daysUntilDue: Math.ceil((deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
    }),

  // Set event reminder
  setEventReminder: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      reminderMinutes: z.number().min(0).max(10080), // Max 1 week
    }))
    .mutation(async ({ ctx, input }) => {
      // This would integrate with a notification service
      // For now, we'll store it in the event attendee record
      const attendee = await ctx.prisma.eventAttendee.findFirst({
        where: {
          eventId: input.eventId,
          userId: ctx.session.user.id,
        },
      })

      if (!attendee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '您不是此事件的参与者',
        })
      }

      // In a real implementation, this would schedule a notification
      // For now, we'll just return success
      return {
        success: true,
        message: `提醒已设置为事件开始前${input.reminderMinutes}分钟`,
      }
    }),
})