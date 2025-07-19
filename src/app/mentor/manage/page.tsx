'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Calendar,
  User,
  GraduationCap,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Star
} from 'lucide-react'
import { api } from '@/lib/trpc'

export default function MentorManagePage() {
  const { data: session } = useSession()
  const [academicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Get applications for this mentor
  const { data: applications, isLoading } = api.mentor.getApplicationsForMentor.useQuery({
    academicYear,
    status: statusFilter as any
  })

  // Get matching statistics
  const { data: stats } = api.mentor.getMatchingStats.useQuery({
    academicYear
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

  if (!session.user.roles.includes('PROFESSOR')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>只有教授可以查看导师申请管理</AlertDescription>
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

  const filteredApplications = applications?.filter(app => 
    searchTerm === '' || 
    app.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />等待匹配</Badge>
      case 'FIRST_MATCHED':
        return <Badge className="bg-blue-100 text-blue-800"><Star className="h-3 w-3 mr-1" />第一志愿匹配</Badge>
      case 'SECOND_MATCHED':
        return <Badge className="bg-green-100 text-green-800"><Star className="h-3 w-3 mr-1" />第二志愿匹配</Badge>
      case 'THIRD_MATCHED':
        return <Badge className="bg-yellow-100 text-yellow-800"><Star className="h-3 w-3 mr-1" />第三志愿匹配</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />已确认</Badge>
      case 'UNMATCHED':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />未匹配</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPreferenceBadge = (level: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      1: '第一志愿',
      2: '第二志愿',
      3: '第三志愿'
    }
    
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[level as keyof typeof labels] || '未知'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              导师申请管理
            </CardTitle>
            <CardDescription>
              管理{academicYear}学年的学生导师申请
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Statistics Overview */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                  <div className="text-sm text-gray-600">总申请数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(stats.FIRST_MATCHED || 0) + (stats.SECOND_MATCHED || 0) + (stats.THIRD_MATCHED || 0)}
                  </div>
                  <div className="text-sm text-gray-600">已匹配</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.PENDING || 0}</div>
                  <div className="text-sm text-gray-600">等待匹配</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.CONFIRMED || 0}</div>
                  <div className="text-sm text-gray-600">已确认</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名或学号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部状态</SelectItem>
                  <SelectItem value="PENDING">等待匹配</SelectItem>
                  <SelectItem value="MATCHED">已匹配</SelectItem>
                  <SelectItem value="CONFIRMED">已确认</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              申请列表 ({filteredApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无申请</h3>
                <p className="text-gray-600">
                  {searchTerm ? '没有找到匹配的申请' : '暂时没有学生申请您作为导师'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Student Info */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{application.student.name}</span>
                              {application.student.studentId && (
                                <span className="text-sm text-gray-500">({application.student.studentId})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getPreferenceBadge(application.preferenceLevel)}
                              {getStatusBadge(application.status)}
                            </div>
                          </div>

                          {/* Application Details */}
                          <Tabs defaultValue="reason" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="reason">申请理由</TabsTrigger>
                              <TabsTrigger value="statement">个人陈述</TabsTrigger>
                              <TabsTrigger value="interest">研究兴趣</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="reason" className="mt-4">
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                {application.preferenceLevel === 1 && application.firstReason}
                                {application.preferenceLevel === 2 && application.secondReason}
                                {application.preferenceLevel === 3 && application.thirdReason}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="statement" className="mt-4">
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                {application.personalStatement}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="interest" className="mt-4">
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                {application.researchInterest}
                              </div>
                            </TabsContent>
                          </Tabs>

                          {/* Student Achievements */}
                          {application.student.studentAchievements.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                学生成果 ({application.student.studentAchievements.length})
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {application.student.studentAchievements.slice(0, 3).map((achievement) => (
                                  <Badge key={achievement.id} variant="outline" className="text-xs">
                                    {achievement.type === 'PAPER' && '论文'}
                                    {achievement.type === 'PATENT' && '专利'}
                                    {achievement.type === 'COMPETITION' && '竞赛'}
                                    {achievement.type === 'SOFTWARE_COPYRIGHT' && '软件著作权'}
                                    {achievement.type === 'OTHER' && '其他'}
                                    : {achievement.title}
                                  </Badge>
                                ))}
                                {application.student.studentAchievements.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{application.student.studentAchievements.length - 3} 更多
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Application Meta */}
                        <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          {application.finalMentorId === session.user.id && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已匹配给您
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Round Info */}
        {stats?.roundDistribution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                匹配轮次分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.roundDistribution[1] || 0}
                  </div>
                  <div className="text-sm text-gray-600">第一轮匹配</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.roundDistribution[2] || 0}
                  </div>
                  <div className="text-sm text-gray-600">第二轮匹配</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.roundDistribution[3] || 0}
                  </div>
                  <div className="text-sm text-gray-600">第三轮匹配</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Info */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>说明：</strong>
            系统使用稳定匹配算法（Gale-Shapley）自动分配导师。学生可以选择最多3个志愿，系统会优先匹配第一志愿，
            如果容量不足则考虑第二、第三志愿。匹配结果需要学生确认后生效。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}