'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Users, GraduationCap, Clock, AlertCircle } from 'lucide-react'
import { api } from '@/lib/trpc'

interface MentorOption {
  id: string
  name: string
  nameEn?: string
  department?: string
  maxStudents: number
  currentStudents: number
  availableSlots: number
}

export default function MentorApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedMentors, setSelectedMentors] = useState<{
    first?: string
    second?: string
    third?: string
  }>({})
  const [formData, setFormData] = useState({
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    firstReason: '',
    secondReason: '',
    thirdReason: '',
    personalStatement: '',
    researchInterest: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get available mentors
  const { data: mentorsData, isLoading: loadingMentors } = api.mentor.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get existing application
  const { data: existingApplication, isLoading: loadingApplication } = api.mentor.getMyApplication.useQuery({
    academicYear: formData.academicYear
  })

  // Submit application
  const submitApplication = api.mentor.apply.useMutation({
    onSuccess: () => {
      router.push('/mentor/status')
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    }
  })

  const mentors = mentorsData?.mentors || []
  const availableMentors = mentors.filter(m => m.availableSlots > 0)

  const handleMentorChange = (choice: 'first' | 'second' | 'third', mentorId: string) => {
    setSelectedMentors(prev => {
      const newSelected = { ...prev }
      
      // Remove this mentor from other choices
      Object.keys(newSelected).forEach(key => {
        if (newSelected[key as keyof typeof newSelected] === mentorId && key !== choice) {
          delete newSelected[key as keyof typeof newSelected]
        }
      })
      
      newSelected[choice] = mentorId
      return newSelected
    })
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [choice]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    // Validation
    if (!selectedMentors.first) {
      newErrors.first = '请选择第一志愿导师'
    }
    if (!selectedMentors.second) {
      newErrors.second = '请选择第二志愿导师'
    }
    if (formData.firstReason.length < 50) {
      newErrors.firstReason = '第一志愿理由至少50字'
    }
    if (formData.secondReason.length < 50) {
      newErrors.secondReason = '第二志愿理由至少50字'
    }
    if (formData.personalStatement.length < 100) {
      newErrors.personalStatement = '个人陈述至少100字'
    }
    if (formData.researchInterest.length < 20) {
      newErrors.researchInterest = '研究兴趣至少20字'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Submit application
    await submitApplication.mutateAsync({
      academicYear: formData.academicYear,
      firstChoiceId: selectedMentors.first!,
      firstReason: formData.firstReason,
      secondChoiceId: selectedMentors.second!,
      secondReason: formData.secondReason,
      thirdChoiceId: selectedMentors.third,
      thirdReason: selectedMentors.third ? formData.thirdReason : undefined,
      personalStatement: formData.personalStatement,
      researchInterest: formData.researchInterest
    })
  }

  const getMentorById = (id: string) => mentors.find(m => m.id === id)

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
          <AlertDescription>只有学生可以申请导师</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loadingMentors || loadingApplication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  // Show existing application if it exists
  if (existingApplication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              导师申请已提交
            </CardTitle>
            <CardDescription>
              您已提交{formData.academicYear}学年的导师申请
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">申请状态</h4>
              <Badge variant={
                existingApplication.status === 'CONFIRMED' ? 'default' :
                existingApplication.status.includes('MATCHED') ? 'secondary' :
                existingApplication.status === 'UNMATCHED' ? 'destructive' : 'outline'
              }>
                {existingApplication.status === 'PENDING' && '待匹配'}
                {existingApplication.status === 'FIRST_MATCHED' && '第一志愿匹配成功'}
                {existingApplication.status === 'SECOND_MATCHED' && '第二志愿匹配成功'}
                {existingApplication.status === 'THIRD_MATCHED' && '第三志愿匹配成功'}
                {existingApplication.status === 'CONFIRMED' && '已确认'}
                {existingApplication.status === 'UNMATCHED' && '未匹配'}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">志愿选择</h4>
              <div className="space-y-2">
                <div>第一志愿: {existingApplication.firstChoice.name}</div>
                <div>第二志愿: {existingApplication.secondChoice.name}</div>
                {existingApplication.thirdChoice && (
                  <div>第三志愿: {existingApplication.thirdChoice.name}</div>
                )}
              </div>
            </div>
            
            {existingApplication.finalMentor && (
              <div>
                <h4 className="font-medium mb-2">匹配结果</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium">{existingApplication.finalMentor.name}</div>
                  <div className="text-sm text-gray-600">{existingApplication.finalMentor.department}</div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={() => router.push('/mentor/status')}>
                查看详细状态
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              导师申请
            </CardTitle>
            <CardDescription>
              选择您希望的导师并提交申请。系统将使用稳定匹配算法为您分配最合适的导师。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Academic Year */}
              <div>
                <Label htmlFor="academicYear">学年</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2024-2025"
                />
              </div>

              {/* Available Mentors Info */}
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  当前有 {availableMentors.length} 位导师可接收学生，共有 {availableMentors.reduce((sum, m) => sum + m.availableSlots, 0)} 个名额
                </AlertDescription>
              </Alert>

              {/* First Choice */}
              <div className="space-y-2">
                <Label htmlFor="firstChoice">第一志愿导师 *</Label>
                <Select
                  value={selectedMentors.first || ''}
                  onValueChange={(value) => handleMentorChange('first', value)}
                >
                  <SelectTrigger className={errors.first ? 'border-red-500' : ''}>
                    <SelectValue placeholder="选择第一志愿导师" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMentors.map(mentor => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{mentor.name}</div>
                            <div className="text-sm text-gray-500">{mentor.department}</div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {mentor.availableSlots}/{mentor.maxStudents}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.first && (
                  <p className="text-sm text-red-500">{errors.first}</p>
                )}
              </div>

              {/* First Choice Reason */}
              <div className="space-y-2">
                <Label htmlFor="firstReason">第一志愿理由 *</Label>
                <Textarea
                  id="firstReason"
                  value={formData.firstReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstReason: e.target.value }))}
                  placeholder="请详细说明选择该导师的理由（至少50字）"
                  className={errors.firstReason ? 'border-red-500' : ''}
                  rows={3}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.firstReason.length}/50</span>
                  {errors.firstReason && (
                    <span className="text-red-500">{errors.firstReason}</span>
                  )}
                </div>
              </div>

              {/* Second Choice */}
              <div className="space-y-2">
                <Label htmlFor="secondChoice">第二志愿导师 *</Label>
                <Select
                  value={selectedMentors.second || ''}
                  onValueChange={(value) => handleMentorChange('second', value)}
                >
                  <SelectTrigger className={errors.second ? 'border-red-500' : ''}>
                    <SelectValue placeholder="选择第二志愿导师" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMentors
                      .filter(mentor => mentor.id !== selectedMentors.first)
                      .map(mentor => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{mentor.name}</div>
                              <div className="text-sm text-gray-500">{mentor.department}</div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {mentor.availableSlots}/{mentor.maxStudents}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.second && (
                  <p className="text-sm text-red-500">{errors.second}</p>
                )}
              </div>

              {/* Second Choice Reason */}
              <div className="space-y-2">
                <Label htmlFor="secondReason">第二志愿理由 *</Label>
                <Textarea
                  id="secondReason"
                  value={formData.secondReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondReason: e.target.value }))}
                  placeholder="请详细说明选择该导师的理由（至少50字）"
                  className={errors.secondReason ? 'border-red-500' : ''}
                  rows={3}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.secondReason.length}/50</span>
                  {errors.secondReason && (
                    <span className="text-red-500">{errors.secondReason}</span>
                  )}
                </div>
              </div>

              {/* Third Choice (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="thirdChoice">第三志愿导师（可选）</Label>
                <Select
                  value={selectedMentors.third || ''}
                  onValueChange={(value) => handleMentorChange('third', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择第三志愿导师（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMentors
                      .filter(mentor => mentor.id !== selectedMentors.first && mentor.id !== selectedMentors.second)
                      .map(mentor => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{mentor.name}</div>
                              <div className="text-sm text-gray-500">{mentor.department}</div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {mentor.availableSlots}/{mentor.maxStudents}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Third Choice Reason */}
              {selectedMentors.third && (
                <div className="space-y-2">
                  <Label htmlFor="thirdReason">第三志愿理由</Label>
                  <Textarea
                    id="thirdReason"
                    value={formData.thirdReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, thirdReason: e.target.value }))}
                    placeholder="请说明选择该导师的理由"
                    rows={3}
                  />
                </div>
              )}

              {/* Personal Statement */}
              <div className="space-y-2">
                <Label htmlFor="personalStatement">个人陈述 *</Label>
                <Textarea
                  id="personalStatement"
                  value={formData.personalStatement}
                  onChange={(e) => setFormData(prev => ({ ...prev, personalStatement: e.target.value }))}
                  placeholder="请介绍您的学术背景、研究经历和未来目标（至少100字）"
                  className={errors.personalStatement ? 'border-red-500' : ''}
                  rows={4}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.personalStatement.length}/100</span>
                  {errors.personalStatement && (
                    <span className="text-red-500">{errors.personalStatement}</span>
                  )}
                </div>
              </div>

              {/* Research Interest */}
              <div className="space-y-2">
                <Label htmlFor="researchInterest">研究兴趣 *</Label>
                <Textarea
                  id="researchInterest"
                  value={formData.researchInterest}
                  onChange={(e) => setFormData(prev => ({ ...prev, researchInterest: e.target.value }))}
                  placeholder="请描述您的研究兴趣和方向（至少20字）"
                  className={errors.researchInterest ? 'border-red-500' : ''}
                  rows={3}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{formData.researchInterest.length}/20</span>
                  {errors.researchInterest && (
                    <span className="text-red-500">{errors.researchInterest}</span>
                  )}
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={submitApplication.isPending}
                  className="flex items-center gap-2"
                >
                  {submitApplication.isPending && (
                    <Clock className="h-4 w-4 animate-spin" />
                  )}
                  提交申请
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Selected Mentors Summary */}
        {(selectedMentors.first || selectedMentors.second || selectedMentors.third) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>志愿选择汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedMentors.first && (
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <Badge>第一志愿</Badge>
                    <div>
                      <div className="font-medium">{getMentorById(selectedMentors.first)?.name}</div>
                      <div className="text-sm text-gray-600">{getMentorById(selectedMentors.first)?.department}</div>
                    </div>
                  </div>
                )}
                {selectedMentors.second && (
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                    <Badge variant="secondary">第二志愿</Badge>
                    <div>
                      <div className="font-medium">{getMentorById(selectedMentors.second)?.name}</div>
                      <div className="text-sm text-gray-600">{getMentorById(selectedMentors.second)?.department}</div>
                    </div>
                  </div>
                )}
                {selectedMentors.third && (
                  <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                    <Badge variant="outline">第三志愿</Badge>
                    <div>
                      <div className="font-medium">{getMentorById(selectedMentors.third)?.name}</div>
                      <div className="text-sm text-gray-600">{getMentorById(selectedMentors.third)?.department}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}