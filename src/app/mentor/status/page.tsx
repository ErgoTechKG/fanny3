'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  GraduationCap,
  FileText,
  Calendar,
  Trophy,
  ArrowRight
} from 'lucide-react'
import { api } from '@/lib/trpc'

export default function MentorStatusPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [academicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)

  // Get application status
  const { data: application, isLoading, refetch } = api.mentor.getMyApplication.useQuery({
    academicYear
  })

  // Confirm match mutation
  const confirmMatch = api.mentor.confirmMatch.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>请先登录以访问此页面</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!session.user.roles.includes('STUDENT')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>只有学生可以查看导师申请状态</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              导师申请状态
            </CardTitle>
            <CardDescription>
              您尚未提交{academicYear}学年的导师申请
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">尚未申请导师</h3>
              <p className="text-gray-600 mb-6">
                请提交导师申请以参与导师匹配系统
              </p>
              <Button onClick={() => router.push('/mentor/apply')}>
                立即申请导师
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: '等待匹配',
          description: '您的申请已提交，等待系统进行匹配',
          color: 'bg-yellow-100 text-yellow-800',
          progress: 25
        }
      case 'FIRST_MATCHED':
        return {
          icon: <Trophy className="h-5 w-5" />,
          label: '第一志愿匹配成功',
          description: '恭喜！您已被第一志愿导师匹配',
          color: 'bg-green-100 text-green-800',
          progress: 75
        }
      case 'SECOND_MATCHED':
        return {
          icon: <Trophy className="h-5 w-5" />,
          label: '第二志愿匹配成功',
          description: '您已被第二志愿导师匹配',
          color: 'bg-blue-100 text-blue-800',
          progress: 75
        }
      case 'THIRD_MATCHED':
        return {
          icon: <Trophy className="h-5 w-5" />,
          label: '第三志愿匹配成功',
          description: '您已被第三志愿导师匹配',
          color: 'bg-purple-100 text-purple-800',
          progress: 75
        }
      case 'CONFIRMED':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          label: '匹配已确认',
          description: '您已确认导师匹配，可以开始研究工作',
          color: 'bg-green-100 text-green-800',
          progress: 100
        }
      case 'UNMATCHED':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: '未匹配',
          description: '很遗憾，本轮未能匹配到导师',
          color: 'bg-red-100 text-red-800',
          progress: 50
        }
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          label: '未知状态',
          description: '',
          color: 'bg-gray-100 text-gray-800',
          progress: 0
        }
    }
  }

  const statusInfo = getStatusInfo(application.status)
  const canConfirm = ['FIRST_MATCHED', 'SECOND_MATCHED', 'THIRD_MATCHED'].includes(application.status)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              导师申请状态
            </CardTitle>
            <CardDescription>
              {academicYear}学年导师申请进度
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{statusInfo.label}</h3>
                <p className="text-sm text-gray-600">{statusInfo.description}</p>
              </div>
              <Badge className={statusInfo.color.replace('bg-', 'bg-').replace('text-', 'text-')}>
                {statusInfo.label}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>申请进度</span>
                <span>{statusInfo.progress}%</span>
              </div>
              <Progress value={statusInfo.progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>已提交</span>
                <span>已匹配</span>
                <span>已确认</span>
              </div>
            </div>

            {/* Confirm Button */}
            {canConfirm && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>请确认接受导师匹配结果</span>
                  <Button 
                    size="sm"
                    onClick={() => confirmMatch.mutate({ academicYear })}
                    disabled={confirmMatch.isPending}
                  >
                    {confirmMatch.isPending ? '确认中...' : '确认匹配'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              申请详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  申请信息
                </h4>
                <div className="space-y-1 text-sm">
                  <div>学年: {application.academicYear}</div>
                  <div>申请时间: {new Date(application.createdAt).toLocaleDateString()}</div>
                  {application.matchRound && (
                    <div>匹配轮次: 第{application.matchRound}轮</div>
                  )}
                </div>
              </div>
              
              {application.finalMentor && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    匹配结果
                  </h4>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium">{application.finalMentor.name}</div>
                    <div className="text-sm text-gray-600">{application.finalMentor.department}</div>
                    <div className="text-sm text-gray-600">{application.finalMentor.email}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Mentor Choices */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                志愿选择
              </h4>
              <div className="space-y-3">
                {/* First Choice */}
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800">第一志愿</Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{application.firstChoice.name}</h5>
                      {application.finalMentorId === application.firstChoiceId && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{application.firstChoice.department}</p>
                    <div className="text-sm">
                      <span className="font-medium">申请理由: </span>
                      {application.firstReason}
                    </div>
                  </div>
                </div>

                {/* Second Choice */}
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Badge className="bg-green-100 text-green-800">第二志愿</Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{application.secondChoice.name}</h5>
                      {application.finalMentorId === application.secondChoiceId && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{application.secondChoice.department}</p>
                    <div className="text-sm">
                      <span className="font-medium">申请理由: </span>
                      {application.secondReason}
                    </div>
                  </div>
                </div>

                {/* Third Choice */}
                {application.thirdChoice && (
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge className="bg-yellow-100 text-yellow-800">第三志愿</Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{application.thirdChoice.name}</h5>
                        {application.finalMentorId === application.thirdChoiceId && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{application.thirdChoice.department}</p>
                      <div className="text-sm">
                        <span className="font-medium">申请理由: </span>
                        {application.thirdReason}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Statement */}
            <div>
              <h4 className="font-medium mb-2">个人陈述</h4>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {application.personalStatement}
              </div>
            </div>

            {/* Research Interest */}
            <div>
              <h4 className="font-medium mb-2">研究兴趣</h4>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {application.researchInterest}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {application.status === 'CONFIRMED' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                下一步
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  恭喜您已成功匹配导师！接下来您可以：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/topics')}
                    className="justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    查看研究题目
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/projects')}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    开始项目
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard')}>
            返回首页
          </Button>
          {application.status === 'UNMATCHED' && (
            <Button 
              variant="outline"
              onClick={() => router.push('/mentor/apply')}
            >
              重新申请
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}