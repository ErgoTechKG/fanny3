'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  AlertCircle, 
  CheckCircle,
  Users,
  Target,
  BarChart3,
  Settings,
  Clock,
  Trophy,
  RefreshCw
} from 'lucide-react'
import { api } from '@/lib/trpc'

export default function MentorMatchingPage() {
  const { data: session } = useSession()
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
  const [isRunning, setIsRunning] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)

  // Get current statistics
  const { data: stats, refetch: refetchStats } = api.mentor.getMatchingStats.useQuery({
    academicYear
  })

  // Run matching mutation
  const runMatching = api.mentor.runMatching.useMutation({
    onSuccess: (result) => {
      setMatchResult(result.data)
      setIsRunning(false)
      refetchStats()
    },
    onError: (error) => {
      setIsRunning(false)
      console.error('Matching failed:', error)
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

  if (!session.user.roles.includes('ADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>只有管理员可以运行导师匹配算法</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleRunMatching = async (dryRun: boolean = false) => {
    setIsRunning(true)
    setMatchResult(null)
    
    try {
      await runMatching.mutateAsync({
        academicYear,
        dryRun
      })
    } catch (error) {
      console.error('Failed to run matching:', error)
    }
  }

  const matchingProgress = stats ? 
    ((stats.FIRST_MATCHED || 0) + (stats.SECOND_MATCHED || 0) + (stats.THIRD_MATCHED || 0)) / (stats.total || 1) * 100 
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              导师匹配算法
            </CardTitle>
            <CardDescription>
              使用Gale-Shapley稳定匹配算法为学生分配导师
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="academicYear">学年</Label>
                <Input
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024-2025"
                  className="max-w-xs"
                />
              </div>
              <Button 
                onClick={() => refetchStats()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                当前统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                  <div className="text-sm text-gray-600">总申请数</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.PENDING || 0}</div>
                  <div className="text-sm text-gray-600">等待匹配</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(stats.FIRST_MATCHED || 0) + (stats.SECOND_MATCHED || 0) + (stats.THIRD_MATCHED || 0)}
                  </div>
                  <div className="text-sm text-gray-600">已匹配</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.CONFIRMED || 0}</div>
                  <div className="text-sm text-gray-600">已确认</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.UNMATCHED || 0}</div>
                  <div className="text-sm text-gray-600">未匹配</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>匹配进度</span>
                  <span>{matchingProgress.toFixed(1)}%</span>
                </div>
                <Progress value={matchingProgress} className="h-2" />
              </div>

              {/* Round Distribution */}
              {stats.roundDistribution && Object.keys(stats.roundDistribution).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">匹配轮次分布</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.roundDistribution[1] || 0}
                      </div>
                      <div className="text-xs text-gray-600">第一轮匹配</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {stats.roundDistribution[2] || 0}
                      </div>
                      <div className="text-xs text-gray-600">第二轮匹配</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {stats.roundDistribution[3] || 0}
                      </div>
                      <div className="text-xs text-gray-600">第三轮匹配</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Matching Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              匹配控制
            </CardTitle>
            <CardDescription>
              运行Gale-Shapley算法进行导师-学生匹配
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorithm Info */}
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Gale-Shapley算法：</strong>
                保证稳定匹配的经典算法。学生作为提议方，导师作为接收方。
                算法会考虑学生的志愿顺序和导师的容量限制，确保不存在阻塞对。
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleRunMatching(true)}
                disabled={isRunning || !stats?.PENDING}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                模拟运行
              </Button>
              
              <Button
                onClick={() => handleRunMatching(false)}
                disabled={isRunning || !stats?.PENDING}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                正式运行匹配
              </Button>
            </div>

            {!stats?.PENDING && stats?.total && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  当前没有待匹配的申请。所有申请都已经被处理。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Match Results */}
        {matchResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                匹配结果
                {matchResult.dryRun && (
                  <Badge variant="outline">模拟运行</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {matchResult.stats?.totalStudents || 0}
                  </div>
                  <div className="text-sm text-gray-600">参与学生</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {matchResult.stats?.matchedStudents || 0}
                  </div>
                  <div className="text-sm text-gray-600">成功匹配</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {matchResult.stats?.totalMentors || 0}
                  </div>
                  <div className="text-sm text-gray-600">参与导师</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {matchResult.stats?.rounds || 0}
                  </div>
                  <div className="text-sm text-gray-600">匹配轮数</div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>匹配成功率</span>
                  <span>
                    {matchResult.stats?.totalStudents > 0 
                      ? ((matchResult.stats.matchedStudents / matchResult.stats.totalStudents) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={matchResult.stats?.totalStudents > 0 
                    ? (matchResult.stats.matchedStudents / matchResult.stats.totalStudents) * 100
                    : 0} 
                  className="h-2" 
                />
              </div>

              {/* Preference Distribution */}
              {matchResult.stats?.preferenceDistribution && (
                <div>
                  <h4 className="font-medium mb-3">志愿满足情况</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {matchResult.stats.preferenceDistribution.first || 0}
                      </div>
                      <div className="text-xs text-gray-600">第一志愿</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {matchResult.stats.preferenceDistribution.second || 0}
                      </div>
                      <div className="text-xs text-gray-600">第二志愿</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {matchResult.stats.preferenceDistribution.third || 0}
                      </div>
                      <div className="text-xs text-gray-600">第三志愿</div>
                    </div>
                  </div>
                </div>
              )}

              {matchResult.dryRun && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    这是模拟运行结果，实际数据未被修改。如果满意结果，请点击"正式运行匹配"。
                  </AlertDescription>
                </Alert>
              )}

              {!matchResult.dryRun && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    匹配算法已成功运行，学生可以查看和确认匹配结果。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Algorithm Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              算法说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Gale-Shapley算法流程：</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>学生按照GPA和研究分数排序，高分学生优先</li>
                  <li>每轮中，未匹配学生向其最偏好的未拒绝导师提出申请</li>
                  <li>导师临时接受容量范围内的最佳申请，拒绝其他</li>
                  <li>被拒绝的学生在下一轮尝试次优选择</li>
                  <li>重复直到没有学生可以继续申请</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">算法特性：</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>保证稳定性：不存在阻塞对（双方都希望换搭档的情况）</li>
                  <li>学生最优：在所有稳定匹配中对学生群体最有利</li>
                  <li>复杂度：O(n²)，其中n为参与者数量</li>
                  <li>考虑容量限制：每位导师可指导多名学生</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">匹配优先级：</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>学生排序：GPA（60%）+ 研究分数（40%）</li>
                  <li>导师偏好：优先考虑学术表现和申请质量</li>
                  <li>志愿顺序：优先满足学生的第一志愿</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}