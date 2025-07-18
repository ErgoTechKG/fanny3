'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { api } from '@/lib/trpc'
import { 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { LogType, MilestoneProgressStatus, AlertLevel } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

// Dynamic import for Recharts to avoid SSR issues
import dynamicImport from 'next/dynamic'
const ResponsiveContainer = dynamicImport(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)
const BarChart = dynamicImport(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
)
const Bar = dynamicImport(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
)
const XAxis = dynamicImport(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamicImport(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
)
const Tooltip = dynamicImport(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
)

export const dynamic = 'force-dynamic'

const logTypeLabels = {
  DAILY: '每日日志',
  WEEKLY: '每周总结',
  MONTHLY: '月度报告',
  SUMMARY: '四周小结',
}

const milestoneStatusColors = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DELAYED: 'bg-red-100 text-red-700',
  AT_RISK: 'bg-orange-100 text-orange-700',
}

const milestoneStatusLabels = {
  PENDING: '待开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  DELAYED: '已延期',
  AT_RISK: '有风险',
}

const alertLevelIcons = {
  GREEN: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  YELLOW: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  RED: <AlertCircle className="h-5 w-5 text-red-500" />,
}

const researchLogSchema = z.object({
  content: z.string().min(50, '日志内容至少50字'),
  type: z.nativeEnum(LogType),
  attachments: z.array(z.string()).optional(),
})

type ResearchLogInput = z.infer<typeof researchLogSchema>

export default function ProgressPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [showLogDialog, setShowLogDialog] = useState(false)

  const { data: projects } = api.progress.getUserProjects.useQuery()
  const { data: projectProgress } = api.progress.getProjectProgress.useQuery(
    { projectId: selectedProject },
    { enabled: !!selectedProject }
  )
  const { data: progressStats } = api.progress.getProgressStats.useQuery(
    { projectId: selectedProject },
    { enabled: !!selectedProject }
  )
  const { data: alerts } = api.progress.getProgressAlerts.useQuery({
    projectId: selectedProject,
  })

  const form = useForm<ResearchLogInput>({
    resolver: zodResolver(researchLogSchema),
    defaultValues: {
      type: LogType.DAILY,
      content: '',
      attachments: [],
    },
  })

  const submitLogMutation = api.progress.submitResearchLog.useMutation({
    onSuccess: () => {
      toast({
        title: '提交成功',
        description: '研究日志已成功提交',
      })
      form.reset()
      setShowLogDialog(false)
    },
    onError: (error) => {
      toast({
        title: '提交失败',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMilestoneMutation = api.progress.updateMilestone.useMutation({
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '里程碑状态已更新',
      })
    },
  })

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const isStudent = session.user.roles.includes('STUDENT')
  const isProfessor = session.user.roles.includes('PROFESSOR')

  const onSubmitLog = (data: ResearchLogInput) => {
    if (!selectedProject) return
    submitLogMutation.mutate({
      projectId: selectedProject,
      ...data,
    })
  }

  // Set default project if not selected
  if (projects && projects.length > 0 && !selectedProject) {
    setSelectedProject(projects[0].id)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">研究进展</h1>
            <p className="text-gray-600 mt-1">
              跟踪项目进度、提交研究日志、管理里程碑
            </p>
          </div>
          {isStudent && (
            <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  提交日志
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>提交研究日志</DialogTitle>
                  <DialogDescription>
                    记录您的研究进展和心得体会
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitLog)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>日志类型</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择日志类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(logTypeLabels).map(([value, label]) => (
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
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>日志内容</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="详细描述您的研究进展..."
                              className="min-h-[200px]"
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
                        onClick={() => setShowLogDialog(false)}
                      >
                        取消
                      </Button>
                      <Button type="submit" disabled={submitLogMutation.isLoading}>
                        提交
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Project Selector */}
        {projects && projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>选择项目</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="选择要查看的项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.topic.title}
                      {isProfessor && project.student && (
                        <span className="text-gray-500 ml-2">
                          - {project.student.name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        {progressStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  总体进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {progressStats.progressPercentage}%
                  </div>
                  <Progress value={progressStats.progressPercentage} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  里程碑
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {progressStats.completedMilestones}/{progressStats.totalMilestones}
                </div>
                <p className="text-xs text-gray-500">已完成</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  研究日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressStats.totalLogs}</div>
                <p className="text-xs text-gray-500">
                  本周 {progressStats.recentLogs} 篇
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  风险预警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {progressStats.delayedMilestones}
                </div>
                <p className="text-xs text-gray-500">需要关注</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {projectProgress && (
          <Tabs defaultValue="milestones">
            <TabsList>
              <TabsTrigger value="milestones">里程碑</TabsTrigger>
              <TabsTrigger value="logs">研究日志</TabsTrigger>
              <TabsTrigger value="timeline">时间线</TabsTrigger>
            </TabsList>

            <TabsContent value="milestones" className="space-y-4">
              <div className="grid gap-4">
                {projectProgress.projectMilestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {alertLevelIcons[milestone.alertLevel]}
                            <CardTitle>{milestone.name}</CardTitle>
                          </div>
                          <CardDescription>
                            截止日期: {format(new Date(milestone.dueDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </CardDescription>
                        </div>
                        <Badge className={milestoneStatusColors[milestone.status]}>
                          {milestoneStatusLabels[milestone.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {milestone.feedback.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">导师反馈</h4>
                            {milestone.feedback.map((fb) => (
                              <div key={fb.id} className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm">{fb.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {fb.professor.name} - {format(new Date(fb.createdAt), 'MM月dd日')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        {isStudent && milestone.status !== MilestoneProgressStatus.COMPLETED && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMilestoneMutation.mutate({
                                id: milestone.id,
                                status: MilestoneProgressStatus.IN_PROGRESS,
                              })}
                            >
                              标记为进行中
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateMilestoneMutation.mutate({
                                id: milestone.id,
                                status: MilestoneProgressStatus.COMPLETED,
                              })}
                            >
                              标记为已完成
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <div className="grid gap-4">
                {projectProgress.researchLogs.map((log) => (
                  <Card key={log.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {logTypeLabels[log.type]}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.createdAt), 'yyyy年MM月dd日 HH:mm')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{log.content}</p>
                      {log.attachments.length > 0 && (
                        <div className="mt-4 flex items-center space-x-2">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            {log.attachments.length} 个附件
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>项目时间线</CardTitle>
                  <CardDescription>
                    项目里程碑和进度可视化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={projectProgress.projectMilestones.map((milestone) => ({
                          name: milestone.name,
                          progress: milestone.status === MilestoneProgressStatus.COMPLETED ? 100 :
                                   milestone.status === MilestoneProgressStatus.IN_PROGRESS ? 50 : 0,
                          status: milestone.status,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="progress" fill="#005BAC" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>预警提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.alertLevel === AlertLevel.RED ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{alert.name}</AlertTitle>
                    <AlertDescription>
                      项目: {alert.project.topic.title} | 
                      学生: {alert.project.student.name} | 
                      截止日期: {format(new Date(alert.dueDate), 'yyyy年MM月dd日')}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}