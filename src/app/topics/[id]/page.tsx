'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GraduationCap,
  Users,
  BookOpen,
  Target,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronLeft,
  Send
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'

export default function TopicDetailPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [applicationData, setApplicationData] = useState({
    resume: '',
    resumeUrl: '',
    statement: ''
  })

  const topicId = params.id as string

  const { data: topic, isLoading } = api.topic.getById.useQuery({ id: topicId })
  
  const utils = api.useContext()
  const createApplication = api.application.create.useMutation({
    onSuccess: () => {
      setShowApplicationDialog(false)
      setApplicationData({ resume: '', resumeUrl: '', statement: '' })
      utils.topic.getById.invalidate({ id: topicId })
      alert('申请提交成功！')
    },
    onError: (error) => {
      alert(error.message)
    }
  })

  if (status === 'loading' || isLoading) {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  if (!topic) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">课题不存在</p>
        </div>
      </DashboardLayout>
    )
  }

  const isStudent = session.user.roles.includes('STUDENT')
  // const isProfessor = session.user.roles.includes('PROFESSOR')
  const isOwner = topic.professorId === session.user.id
  const hasApplied = topic.applications.some(app => app.studentId === session.user.id)
  const isEnrolled = topic.projects.some(proj => proj.studentId === session.user.id)
  const canApply = isStudent && topic.status === 'RECRUITING' && !hasApplied && !isEnrolled && topic.currentStudents < topic.maxStudents

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-700',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
    ADVANCED: 'bg-red-100 text-red-700',
  }

  const difficultyLabels = {
    BEGINNER: '初级',
    INTERMEDIATE: '中级',
    ADVANCED: '高级',
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    RECRUITING: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
  }

  const statusLabels = {
    DRAFT: '草稿',
    RECRUITING: '招生中',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  }

  const handleApplicationSubmit = () => {
    if (!applicationData.resume || !applicationData.statement) {
      alert('请填写完整的申请信息')
      return
    }

    createApplication.mutate({
      topicId: topic.id,
      resume: applicationData.resume,
      resumeUrl: applicationData.resumeUrl,
      statement: applicationData.statement
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/topics">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              返回课题列表
            </Button>
          </Link>
          {isOwner && (
            <Link href={`/topics/${topic.id}/edit`}>
              <Button variant="outline">编辑课题</Button>
            </Link>
          )}
        </div>

        {/* Topic Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColors[topic.status]}>
                    {statusLabels[topic.status]}
                  </Badge>
                  <Badge variant="outline">{topic.field}</Badge>
                  <Badge className={difficultyColors[topic.difficulty]}>
                    {difficultyLabels[topic.difficulty]}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
                {topic.titleEn && (
                  <p className="text-lg text-gray-600 mb-2">{topic.titleEn}</p>
                )}
                <CardDescription>{topic.description}</CardDescription>
                {topic.descriptionEn && (
                  <p className="text-sm text-gray-500 mt-2">{topic.descriptionEn}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">指导教授</p>
                  <p className="font-medium">{topic.professor.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">招生人数</p>
                  <p className="font-medium">{topic.currentStudents} / {topic.maxStudents}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">申请人数</p>
                  <p className="font-medium">{topic.applications.length}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">发布时间</p>
                  <p className="font-medium">{new Date(topic.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
          {canApply && (
            <CardFooter>
              <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    申请课题
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>申请研究课题</DialogTitle>
                    <DialogDescription>
                      请填写您的申请信息，导师会根据您的背景和研究兴趣进行评估
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resume">个人简历 (至少50字)</Label>
                      <Textarea
                        id="resume"
                        placeholder="请介绍您的教育背景、研究经历、技能特长等..."
                        value={applicationData.resume}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApplicationData({ ...applicationData, resume: e.target.value })}
                        className="min-h-[120px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resumeUrl">简历附件链接 (可选)</Label>
                      <Input
                        id="resumeUrl"
                        type="url"
                        placeholder="https://..."
                        value={applicationData.resumeUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplicationData({ ...applicationData, resumeUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="statement">个人陈述 (至少100字)</Label>
                      <Textarea
                        id="statement"
                        placeholder="请说明您对该课题的理解、研究兴趣、以及您能为该项目带来的贡献..."
                        value={applicationData.statement}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApplicationData({ ...applicationData, statement: e.target.value })}
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleApplicationSubmit}
                      disabled={createApplication.isLoading}
                    >
                      {createApplication.isLoading ? '提交中...' : '提交申请'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          )}
          {hasApplied && (
            <CardFooter>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  您已申请此课题，请等待导师审核
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
          {isEnrolled && (
            <CardFooter>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  您已加入此课题
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>

        {/* Detailed Information */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">详细信息</TabsTrigger>
            <TabsTrigger value="requirements">要求与预期</TabsTrigger>
            {isOwner && (
              <>
                <TabsTrigger value="applications">申请管理</TabsTrigger>
                <TabsTrigger value="students">学生管理</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>课题详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {topic.startDate && topic.endDate && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      研究周期
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(topic.startDate).toLocaleDateString()} - {new Date(topic.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {topic.attachmentUrl && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      附件资料
                    </h4>
                    <a 
                      href={topic.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      下载课题详细资料
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">研究领域</h4>
                  <Badge variant="outline">{topic.field}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">难度等级</h4>
                  <Badge className={difficultyColors[topic.difficulty]}>
                    {difficultyLabels[topic.difficulty]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>前置要求与预期成果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    前置要求
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {topic.prerequisites.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600">{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    预期成果
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {topic.expectedOutcomes.map((outcome, index) => (
                      <li key={index} className="text-sm text-gray-600">{outcome}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <>
              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle>申请管理</CardTitle>
                    <CardDescription>审核和管理学生申请</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topic.applications.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">暂无申请</p>
                    ) : (
                      <div className="space-y-4">
                        {topic.applications.map((application) => (
                          <Card key={application.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{application.student.name}</p>
                                  <p className="text-sm text-gray-600">{application.student.email}</p>
                                </div>
                                <Badge>{application.status}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <p className="font-medium">个人简历：</p>
                                  <p className="text-gray-600">{application.resume}</p>
                                </div>
                                <div>
                                  <p className="font-medium">个人陈述：</p>
                                  <p className="text-gray-600">{application.statement}</p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                              <Button size="sm" variant="outline">查看详情</Button>
                              {application.status === 'PENDING' && (
                                <>
                                  <Button size="sm" variant="default">通过</Button>
                                  <Button size="sm" variant="destructive">拒绝</Button>
                                </>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>学生管理</CardTitle>
                    <CardDescription>管理已加入课题的学生</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topic.projects.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">暂无学生</p>
                    ) : (
                      <div className="space-y-4">
                        {topic.projects.map((project) => (
                          <Card key={project.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{project.student.name}</p>
                                  <p className="text-sm text-gray-600">{project.student.email}</p>
                                </div>
                                <Badge>{project.status}</Badge>
                              </div>
                            </CardHeader>
                            <CardFooter>
                              <Button size="sm" variant="outline">查看进度</Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}