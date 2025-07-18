'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  TrendingUp, 
  Award, 
  Users, 
  Calendar,
  Bell,
  BarChart3,
  GraduationCap,
  Clock,
  Target
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const isStudent = session.user.roles.includes('STUDENT')
  const isProfessor = session.user.roles.includes('PROFESSOR')
  const isSecretary = session.user.roles.includes('SECRETARY')
  const isAdmin = session.user.roles.includes('ADMIN')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            欢迎回来，{session.user.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {isStudent && '查看您的科研进度和最新动态'}
            {isProfessor && '管理您的研究团队和课题'}
            {isSecretary && '处理科研管理事务'}
            {isAdmin && '系统管理与数据概览'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isStudent && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">我的课题</CardTitle>
                  <FileText className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-gray-600">1个进行中，1个已完成</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">研究进度</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">65%</div>
                  <p className="text-xs text-gray-600">本月提升12%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">科研成果</CardTitle>
                  <Award className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-gray-600">论文2篇，专利1项</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">待办事项</CardTitle>
                  <Bell className="h-4 w-4 text-[#E60012]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-gray-600">2个紧急，3个普通</p>
                </CardContent>
              </Card>
            </>
          )}

          {isProfessor && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">指导学生</CardTitle>
                  <Users className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-gray-600">8个本科生，4个研究生</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">活跃课题</CardTitle>
                  <FileText className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-gray-600">本月新增2个</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">待审申请</CardTitle>
                  <Clock className="h-4 w-4 text-[#E60012]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-gray-600">需要您的审核</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">成果产出</CardTitle>
                  <Award className="h-4 w-4 text-[#005BAC]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-gray-600">本年度累计</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="topics">课题管理</TabsTrigger>
            <TabsTrigger value="progress">进度跟踪</TabsTrigger>
            {(isProfessor || isAdmin) && (
              <TabsTrigger value="analytics">数据分析</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                  <CardDescription>您的最新科研动态</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">提交了进度报告</p>
                        <p className="text-xs text-gray-600">深度学习在医疗影像中的应用 - 2小时前</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">课题申请已通过</p>
                        <p className="text-xs text-gray-600">智能交通系统优化研究 - 昨天</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">收到导师反馈</p>
                        <p className="text-xs text-gray-600">请修改实验设计部分 - 3天前</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>即将到期</CardTitle>
                  <CardDescription>需要关注的重要日期</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">中期答辩</p>
                        <p className="text-xs text-gray-600">深度学习在医疗影像中的应用</p>
                      </div>
                      <div className="text-sm text-red-600 font-medium">3天后</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">论文初稿提交</p>
                        <p className="text-xs text-gray-600">计算机视觉综述</p>
                      </div>
                      <div className="text-sm text-yellow-600 font-medium">1周后</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">项目结题报告</p>
                        <p className="text-xs text-gray-600">机器人路径规划算法</p>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">2周后</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
                <CardDescription>常用功能入口</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {isStudent && (
                    <>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="text-xs">申请课题</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <TrendingUp className="h-6 w-6 mb-2" />
                        <span className="text-xs">提交进度</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <Award className="h-6 w-6 mb-2" />
                        <span className="text-xs">上传成果</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="text-xs">查看日程</span>
                      </Button>
                    </>
                  )}
                  {isProfessor && (
                    <>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="text-xs">发布课题</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <Users className="h-6 w-6 mb-2" />
                        <span className="text-xs">审核申请</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <BarChart3 className="h-6 w-6 mb-2" />
                        <span className="text-xs">查看报表</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col py-4">
                        <Target className="h-6 w-6 mb-2" />
                        <span className="text-xs">评价学生</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle>课题管理</CardTitle>
                <CardDescription>管理您的研究课题</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">课题管理功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>进度跟踪</CardTitle>
                <CardDescription>查看和更新研究进度</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">进度跟踪功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {(isProfessor || isAdmin) && (
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>数据分析</CardTitle>
                  <CardDescription>科研数据统计与分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">数据分析功能开发中...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}