'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Building,
  Award,
  Target,
  Save
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'
import type { ApplicationStatus } from '@prisma/client'

interface ApplicationUpdate {
  applicationId: string
  status: ApplicationStatus
  professorNote?: string
}

export default function ApplicationsReviewPage() {
  const { data: session, status } = useSession()
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [batchAction, setBatchAction] = useState<ApplicationStatus | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)
  const [professorNote, setProfessorNote] = useState('')

  const { data: myTopics } = api.topic.getMyTopics.useQuery({})
  const { data: topicDetails } = api.topicManagement.getTopicWithApplications.useQuery(
    { topicId: selectedTopic },
    { enabled: !!selectedTopic }
  )

  const utils = api.useContext()
  const batchUpdate = api.topicManagement.batchUpdateApplications.useMutation({
    onSuccess: () => {
      utils.topicManagement.getTopicWithApplications.invalidate({ topicId: selectedTopic })
      setSelectedApplications(new Set())
      setBatchAction(null)
      alert('批量更新成功')
    },
    onError: (error) => {
      alert(error.message)
    }
  })

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const isProfessor = session.user.roles.includes('PROFESSOR')
  
  if (!isProfessor) {
    redirect('/dashboard')
  }

  const handleBatchUpdate = () => {
    if (!batchAction || selectedApplications.size === 0) {
      alert('请选择操作和申请')
      return
    }

    const updates: ApplicationUpdate[] = Array.from(selectedApplications).map(id => ({
      applicationId: id,
      status: batchAction
    }))

    batchUpdate.mutate({ updates })
  }

  const handleIndividualUpdate = (applicationId: string, status: ApplicationStatus, note?: string) => {
    batchUpdate.mutate({
      updates: [{
        applicationId,
        status,
        professorNote: note
      }]
    })
  }

  const toggleApplication = (applicationId: string) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId)
    } else {
      newSelected.add(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterApplicationsByStatus = (applications: any[], status: ApplicationStatus) => {
    return applications.filter(app => app.status === status)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">申请审核</h1>
          <p className="text-gray-600 mt-1">管理和审核学生的课题申请</p>
        </div>

        {/* Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle>选择课题</CardTitle>
            <CardDescription>选择一个课题查看相关申请</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="选择一个课题" />
              </SelectTrigger>
              <SelectContent>
                {myTopics?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title} ({topic._count.applications} 申请)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Applications */}
        {selectedTopic && topicDetails && 'applications' in topicDetails && (
          <>
            {/* Topic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总申请数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{topicDetails?.applications?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">待审核</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {filterApplicationsByStatus(topicDetails?.applications || [], 'PENDING').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">审核中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {filterApplicationsByStatus(topicDetails?.applications || [], 'REVIEWING').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">已通过</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {filterApplicationsByStatus(topicDetails?.applications || [], 'ACCEPTED').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {filterApplicationsByStatus(topicDetails?.applications || [], 'REJECTED').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Batch Actions */}
            {selectedApplications.size > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>已选择 {selectedApplications.size} 个申请</span>
                  <div className="flex gap-2">
                    <Select value={batchAction || ''} onValueChange={(value) => setBatchAction(value as ApplicationStatus)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="批量操作" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REVIEWING">标记为审核中</SelectItem>
                        <SelectItem value="ACCEPTED">批量通过</SelectItem>
                        <SelectItem value="REJECTED">批量拒绝</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={handleBatchUpdate}
                      disabled={!batchAction || batchUpdate.isLoading}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      应用
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Applications Tabs */}
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  待审核 ({filterApplicationsByStatus(topicDetails?.applications || [], 'PENDING').length})
                </TabsTrigger>
                <TabsTrigger value="reviewing">
                  审核中 ({filterApplicationsByStatus(topicDetails?.applications || [], 'REVIEWING').length})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  已通过 ({filterApplicationsByStatus(topicDetails?.applications || [], 'ACCEPTED').length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  已拒绝 ({filterApplicationsByStatus(topicDetails?.applications || [], 'REJECTED').length})
                </TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {filterApplicationsByStatus(topicDetails?.applications || [], 'PENDING').map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplications.has(app.id)}
                    onToggle={() => toggleApplication(app.id)}
                    onUpdate={handleIndividualUpdate}
                    onAddNote={(app) => {
                      setCurrentApplication(app)
                      setProfessorNote(app.professorNote || '')
                      setShowNoteDialog(true)
                    }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="reviewing" className="space-y-4">
                {filterApplicationsByStatus(topicDetails?.applications || [], 'REVIEWING').map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplications.has(app.id)}
                    onToggle={() => toggleApplication(app.id)}
                    onUpdate={handleIndividualUpdate}
                    onAddNote={(app) => {
                      setCurrentApplication(app)
                      setProfessorNote(app.professorNote || '')
                      setShowNoteDialog(true)
                    }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="accepted" className="space-y-4">
                {filterApplicationsByStatus(topicDetails?.applications || [], 'ACCEPTED').map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplications.has(app.id)}
                    onToggle={() => toggleApplication(app.id)}
                    onUpdate={handleIndividualUpdate}
                    onAddNote={(app) => {
                      setCurrentApplication(app)
                      setProfessorNote(app.professorNote || '')
                      setShowNoteDialog(true)
                    }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {filterApplicationsByStatus(topicDetails?.applications || [], 'REJECTED').map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplications.has(app.id)}
                    onToggle={() => toggleApplication(app.id)}
                    onUpdate={handleIndividualUpdate}
                    onAddNote={(app) => {
                      setCurrentApplication(app)
                      setProfessorNote(app.professorNote || '')
                      setShowNoteDialog(true)
                    }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {topicDetails?.applications?.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplications.has(app.id)}
                    onToggle={() => toggleApplication(app.id)}
                    onUpdate={handleIndividualUpdate}
                    onAddNote={(app) => {
                      setCurrentApplication(app)
                      setProfessorNote(app.professorNote || '')
                      setShowNoteDialog(true)
                    }}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Note Dialog */}
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加备注</DialogTitle>
              <DialogDescription>
                为 {currentApplication?.student.name} 的申请添加备注
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note">备注内容</Label>
                <Textarea
                  id="note"
                  placeholder="输入您的备注..."
                  value={professorNote}
                  onChange={(e) => setProfessorNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                取消
              </Button>
              <Button onClick={() => {
                if (currentApplication) {
                  handleIndividualUpdate(
                    currentApplication.id,
                    currentApplication.status,
                    professorNote
                  )
                  setShowNoteDialog(false)
                }
              }}>
                保存备注
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

// Application Card Component
function ApplicationCard({ 
  application, 
  isSelected, 
  onToggle, 
  onUpdate,
  onAddNote
}: {
  application: any
  isSelected: boolean
  onToggle: () => void
  onUpdate: (id: string, status: ApplicationStatus, note?: string) => void
  onAddNote: (app: any) => void
}) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    REVIEWING: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-gray-100 text-gray-700',
  }

  const statusLabels = {
    PENDING: '待审核',
    REVIEWING: '审核中',
    ACCEPTED: '已通过',
    REJECTED: '已拒绝',
    WITHDRAWN: '已撤回',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggle}
              className="mt-1"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{application.student.name}</h4>
                <Badge className={statusColors[application.status]}>
                  {statusLabels[application.status]}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {application.student.email}
                </span>
                {application.student.phone && (
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {application.student.phone}
                  </span>
                )}
                <span className="flex items-center">
                  <Building className="h-3 w-3 mr-1" />
                  {application.student.department}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(application.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-600">学号</p>
              <p className="font-medium">{application.student.studentId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-600">成就</p>
              <p className="font-medium">{application.student.achievements.length} 项</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-600">项目经验</p>
              <p className="font-medium">{application.student.projects.length} 个</p>
            </div>
          </div>
        </div>

        {/* Application Content */}
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium mb-1">个人简历</h5>
            <p className="text-sm text-gray-600 line-clamp-3">{application.resume}</p>
          </div>
          <div>
            <h5 className="text-sm font-medium mb-1">个人陈述</h5>
            <p className="text-sm text-gray-600 line-clamp-3">{application.statement}</p>
          </div>
          {application.professorNote && (
            <div>
              <h5 className="text-sm font-medium mb-1">导师备注</h5>
              <p className="text-sm text-gray-600">{application.professorNote}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {application.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onUpdate(application.id, 'ACCEPTED')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                通过
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdate(application.id, 'REJECTED')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                拒绝
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdate(application.id, 'REVIEWING')}
              >
                <Clock className="h-4 w-4 mr-1" />
                审核中
              </Button>
            </>
          )}
          {application.status === 'REVIEWING' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onUpdate(application.id, 'ACCEPTED')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                通过
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdate(application.id, 'REJECTED')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                拒绝
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddNote(application)}
          >
            <FileText className="h-4 w-4 mr-1" />
            备注
          </Button>
          {application.resumeUrl && (
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="ghost">
                <FileText className="h-4 w-4 mr-1" />
                查看简历
              </Button>
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}