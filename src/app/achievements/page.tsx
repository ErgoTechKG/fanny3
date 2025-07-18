'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy,
  FileText,
  Award,
  Calendar,
  User,
  Plus,
  Filter,
  Download,
  ExternalLink,
  Medal,
  BookOpen,
  Lightbulb
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'
import type { AchievementType } from '@prisma/client'

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const { data: achievements, isLoading } = api.achievement.getAll.useQuery()

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

  const typeIcons = {
    PAPER: <FileText className="h-5 w-5" />,
    PATENT: <Lightbulb className="h-5 w-5" />,
    AWARD: <Trophy className="h-5 w-5" />,
    CONFERENCE: <BookOpen className="h-5 w-5" />,
    OTHER: <Medal className="h-5 w-5" />,
  }

  const typeLabels = {
    PAPER: '论文',
    PATENT: '专利',
    AWARD: '获奖',
    CONFERENCE: '会议',
    OTHER: '其他',
  }

  const typeColors = {
    PAPER: 'bg-blue-100 text-blue-700',
    PATENT: 'bg-green-100 text-green-700',
    AWARD: 'bg-yellow-100 text-yellow-700',
    CONFERENCE: 'bg-purple-100 text-purple-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }

  // Filter achievements based on search and filters
  const filteredAchievements = achievements?.filter(achievement => {
    if (search && !achievement.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (selectedType !== 'all' && achievement.type !== selectedType) {
      return false
    }
    if (selectedYear !== 'all' && new Date(achievement.achievedAt).getFullYear().toString() !== selectedYear) {
      return false
    }
    return true
  }) || []

  // Get unique years for filter
  const years = [...new Set(achievements?.map(a => 
    new Date(a.achievedAt).getFullYear().toString()
  ) || [])].sort((a, b) => b.localeCompare(a))

  // Group achievements by type for stats
  const achievementStats = achievements?.reduce((acc, achievement) => {
    acc[achievement.type] = (acc[achievement.type] || 0) + 1
    return acc
  }, {} as Record<AchievementType, number>) || {}

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">科研成果</h1>
            <p className="text-gray-600 mt-1">
              {isStudent ? '管理您的科研成果记录' : '查看和管理科研成果'}
            </p>
          </div>
          {(isStudent || isProfessor) && (
            <Link href="/achievements/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                登记成果
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总成果数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{achievements?.length || 0}</div>
            </CardContent>
          </Card>
          {Object.entries(typeLabels).map(([type, label]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  {typeIcons[type as AchievementType]}
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievementStats[type as AchievementType] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索成果标题..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="成果类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年份</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Achievements List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">全部成果</TabsTrigger>
            <TabsTrigger value="my">我的成果</TabsTrigger>
            {isProfessor && <TabsTrigger value="supervised">指导成果</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : filteredAchievements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">没有找到符合条件的成果</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAchievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${typeColors[achievement.type]} bg-opacity-20`}>
                            {typeIcons[achievement.type]}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{achievement.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {achievement.description}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {achievement.authors?.join(', ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(achievement.achievedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={typeColors[achievement.type]}>
                          {typeLabels[achievement.type]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <div className="flex gap-2">
                        {achievement.attachmentUrl && (
                          <a
                            href={achievement.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              下载附件
                            </Button>
                          </a>
                        )}
                        {achievement.link && (
                          <a
                            href={achievement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              查看详情
                            </Button>
                          </a>
                        )}
                      </div>
                      <Link href={`/achievements/${achievement.id}`}>
                        <Button variant="ghost" size="sm">
                          查看详情
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              功能开发中...
            </div>
          </TabsContent>

          {isProfessor && (
            <TabsContent value="supervised" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                功能开发中...
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}