'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { api } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import { 
  MapPin,
  Users,
  Plus,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from 'lucide-react'
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { EventType, AttendeeStatus } from '@prisma/client'
import type { Event, User, Project, Topic, EventAttendee, MilestoneProgressStatus, AlertLevel } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const eventTypeLabels = {
  MEETING: '会议',
  DEADLINE: '截止日期',
  DEFENSE: '答辩',
  WORKSHOP: '研讨会',
  LAB_ROTATION: '实验室轮转',
  MILESTONE_DUE: '里程碑截止',
  OTHER: '其他',
}

const eventTypeColors = {
  MEETING: 'bg-blue-100 text-blue-700',
  DEADLINE: 'bg-red-100 text-red-700',
  DEFENSE: 'bg-purple-100 text-purple-700',
  WORKSHOP: 'bg-green-100 text-green-700',
  LAB_ROTATION: 'bg-yellow-100 text-yellow-700',
  MILESTONE_DUE: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

const createEventSchema = z.object({
  title: z.string().min(2, '标题至少2字'),
  description: z.string().optional(),
  startTime: z.string().min(1, '请选择开始时间'),
  endTime: z.string().min(1, '请选择结束时间'),
  location: z.string().optional(),
  type: z.nativeEnum(EventType),
})

type CreateEventInput = z.infer<typeof createEventSchema>

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event & {
    createdBy: Pick<User, 'name'>
    project?: (Project & { topic: Pick<Topic, 'title'> }) | null
    attendees: Array<EventAttendee & { user: Pick<User, 'name' | 'email'> }>
    isMilestone?: boolean
    milestoneStatus?: MilestoneProgressStatus
    alertLevel?: AlertLevel
  } | null>(null)

  const { data: events, refetch: refetchEvents } = api.calendar.getEvents.useQuery({
    viewType,
    currentDate: date,
    type: selectedEventType === 'all' ? undefined : selectedEventType as EventType,
  })

  const { data: upcomingDeadlines } = api.calendar.getUpcomingDeadlines.useQuery({
    days: 7,
  })

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      type: EventType.MEETING,
    },
  })

  const createEventMutation = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast({
        title: '创建成功',
        description: '事件已成功创建',
      })
      form.reset()
      setShowCreateDialog(false)
      refetchEvents()
    },
    onError: (error) => {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateAttendeeMutation = api.calendar.updateAttendeeStatus.useMutation({
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '您的出席状态已更新',
      })
      refetchEvents()
    },
  })

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const onCreateEvent = (data: CreateEventInput) => {
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    
    createEventMutation.mutate({
      ...data,
      startTime,
      endTime,
    })
  }

  const renderCalendarContent = () => {
    if (!events) return null

    // Group events by date for calendar display
    const eventsByDate = events.reduce((acc, event) => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    }, {} as Record<string, typeof events>)

    if (viewType === 'month') {
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

      return (
        <div className="grid grid-cols-7 gap-1">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateKey] || []
            const isToday = isSameDay(day, new Date())
            
            return (
              <div
                key={dateKey}
                className={`min-h-[100px] p-2 border rounded-md ${
                  isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: event.isMilestone ? 
                          (event.alertLevel === 'RED' ? '#fee2e2' : 
                           event.alertLevel === 'YELLOW' ? '#fef3c7' : '#d1fae5') :
                          eventTypeColors[event.type].split(' ')[0].replace('bg-', '#').replace('-100', ''),
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="truncate">{event.title}</div>
                      <div className="text-[10px] opacity-75">
                        {format(new Date(event.startTime), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 text-center">
                      +{dayEvents.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // List view for week/day
    return (
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  {event.description && (
                    <CardDescription>{event.description}</CardDescription>
                  )}
                </div>
                <Badge className={event.isMilestone ? 
                  (event.alertLevel === 'RED' ? 'bg-red-100 text-red-700' : 
                   event.alertLevel === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 
                   'bg-green-100 text-green-700') :
                  eventTypeColors[event.type]
                }>
                  {eventTypeLabels[event.type]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {format(new Date(event.startTime), 'MM月dd日 HH:mm')} - 
                  {format(new Date(event.endTime), 'HH:mm')}
                </div>
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </div>
                )}
                {event.attendees.length > 0 && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {event.attendees.length} 参与者
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">日程安排</h1>
            <p className="text-gray-600 mt-1">
              管理您的会议、截止日期和重要事件
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建事件
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>创建新事件</DialogTitle>
                <DialogDescription>
                  填写事件信息，邀请参与者
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateEvent)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事件标题</FormLabel>
                        <FormControl>
                          <Input placeholder="输入事件标题" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事件类型</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择事件类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(eventTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>开始时间</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>结束时间</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>地点（可选）</FormLabel>
                        <FormControl>
                          <Input placeholder="输入事件地点" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>描述（可选）</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="输入事件描述"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={createEventMutation.isLoading}>
                      创建
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Deadlines Alert */}
        {upcomingDeadlines && upcomingDeadlines.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>即将到来的截止日期</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {upcomingDeadlines.slice(0, 3).map((deadline) => (
                  <div key={deadline.id} className="text-sm">
                    {deadline.title} - {deadline.daysUntilDue} 天后到期
                    ({format(new Date(deadline.dueDate), 'MM月dd日')})
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Calendar Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date)
                    if (viewType === 'month') {
                      newDate.setMonth(date.getMonth() - 1)
                    } else if (viewType === 'week') {
                      newDate.setDate(date.getDate() - 7)
                    } else {
                      newDate.setDate(date.getDate() - 1)
                    }
                    setDate(newDate)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(date, 'yyyy年MM月', { locale: zhCN })}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date)
                    if (viewType === 'month') {
                      newDate.setMonth(date.getMonth() + 1)
                    } else if (viewType === 'week') {
                      newDate.setDate(date.getDate() + 7)
                    } else {
                      newDate.setDate(date.getDate() + 1)
                    }
                    setDate(newDate)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(new Date())}
                >
                  今天
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="事件类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)}>
                  <TabsList>
                    <TabsTrigger value="month">月</TabsTrigger>
                    <TabsTrigger value="week">周</TabsTrigger>
                    <TabsTrigger value="day">日</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderCalendarContent()}
          </CardContent>
        </Card>

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
              <DialogDescription>
                <Badge className={selectedEvent?.isMilestone ? 
                  'bg-orange-100 text-orange-700' :
                  eventTypeColors[selectedEvent?.type]
                }>
                  {selectedEvent && eventTypeLabels[selectedEvent.type]}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">时间</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedEvent.startTime), 'yyyy年MM月dd日 HH:mm')} - 
                    {format(new Date(selectedEvent.endTime), 'HH:mm')}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h4 className="font-medium mb-1">地点</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium mb-1">描述</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.createdBy && (
                  <div>
                    <h4 className="font-medium mb-1">创建者</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.createdBy.name}</p>
                  </div>
                )}
                {selectedEvent.attendees?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">参与者</h4>
                    <div className="space-y-2">
                      {selectedEvent.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between text-sm">
                          <span>{attendee.user.name}</span>
                          <Badge variant={
                            attendee.status === AttendeeStatus.ACCEPTED ? 'default' :
                            attendee.status === AttendeeStatus.DECLINED ? 'destructive' :
                            'secondary'
                          }>
                            {attendee.status === AttendeeStatus.ACCEPTED ? '已接受' :
                             attendee.status === AttendeeStatus.DECLINED ? '已拒绝' :
                             attendee.status === AttendeeStatus.MAYBE ? '待定' : '待回复'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEvent.attendees?.some((a) => a.userId === session.user.id) && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAttendeeMutation.mutate({
                        eventId: selectedEvent.id,
                        status: AttendeeStatus.ACCEPTED,
                      })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      接受
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAttendeeMutation.mutate({
                        eventId: selectedEvent.id,
                        status: AttendeeStatus.DECLINED,
                      })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      拒绝
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}