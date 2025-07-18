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
import { 
  Search,
  Grid3X3,
  List,
  Users,
  Clock,
  BookOpen,
  GraduationCap,
  Plus,
  ChevronRight,
  Star,
  Target
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'
import type { Difficulty } from '@prisma/client'

export default function TopicsPage() {
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [selectedField, setSelectedField] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: topicsData, isLoading } = api.topic.getAll.useQuery({
    search,
    field: selectedField === 'all' ? undefined : selectedField,
    difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty as Difficulty,
    status: 'RECRUITING',
  })

  const { data: matchedTopics } = api.topicManagement.getMatchedTopics.useQuery({
    limit: 5,
  })

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const isStudent = session.user.roles.includes('STUDENT')
  const isProfessor = session.user.roles.includes('PROFESSOR')

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">研究课题</h1>
            <p className="text-gray-600 mt-1">
              {isStudent ? '浏览和申请适合您的研究课题' : '管理和发布研究课题'}
            </p>
          </div>
          {isProfessor && (
            <Link href="/topics/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                发布新课题
              </Button>
            </Link>
          )}
        </div>

        {/* Matched Topics for Students */}
        {isStudent && matchedTopics && matchedTopics.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <CardTitle>推荐课题</CardTitle>
                </div>
                <Badge variant="secondary">基于您的兴趣</Badge>
              </div>
              <CardDescription>根据您的申请历史和成就为您推荐的课题</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {matchedTopics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.id}`} className="flex-shrink-0">
                    <Card className="w-64 hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm line-clamp-2">{topic.title}</CardTitle>
                          <Badge className={`${difficultyColors[topic.difficulty]} text-xs`}>
                            {difficultyLabels[topic.difficulty]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {topic.professor.name}
                          </div>
                          <div className="flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            匹配度: {topic.matchScore}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索课题标题或描述..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择领域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部领域</SelectItem>
                    <SelectItem value="人工智能">人工智能</SelectItem>
                    <SelectItem value="机器学习">机器学习</SelectItem>
                    <SelectItem value="计算机视觉">计算机视觉</SelectItem>
                    <SelectItem value="自然语言处理">自然语言处理</SelectItem>
                    <SelectItem value="机器人学">机器人学</SelectItem>
                    <SelectItem value="数据科学">数据科学</SelectItem>
                    <SelectItem value="网络安全">网络安全</SelectItem>
                    <SelectItem value="软件工程">软件工程</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="难度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部难度</SelectItem>
                    <SelectItem value="BEGINNER">初级</SelectItem>
                    <SelectItem value="INTERMEDIATE">中级</SelectItem>
                    <SelectItem value="ADVANCED">高级</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topics List/Grid */}
        {isLoading ? (
          <div className="text-center py-8">加载中...</div>
        ) : !topicsData || topicsData.topics.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">没有找到符合条件的课题</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicsData.topics.map((topic) => (
              <Link key={topic.id} href={`/topics/${topic.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={difficultyColors[topic.difficulty]}>
                        {difficultyLabels[topic.difficulty]}
                      </Badge>
                      <Badge variant="outline">{topic.field}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{topic.title}</CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          {topic.professor.name}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {topic.currentStudents}/{topic.maxStudents}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {topic._count.applications} 申请
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(topic.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full">
                      查看详情
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        课题标题
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        导师
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        领域
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        难度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        招生情况
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        申请人数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topicsData.topics.map((topic) => (
                      <tr key={topic.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {topic.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{topic.professor.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{topic.field}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={difficultyColors[topic.difficulty]}>
                            {difficultyLabels[topic.difficulty]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {topic.currentStudents}/{topic.maxStudents}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{topic._count.applications}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/topics/${topic.id}`}>
                            <Button variant="ghost" size="sm">
                              查看详情
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {topicsData && topicsData.totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: topicsData.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === topicsData.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    // Handle pagination
                  }}
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}