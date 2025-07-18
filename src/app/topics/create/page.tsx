'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronLeft,
  Plus,
  X,
  Loader2,
  FileText,
  Target,
  BookOpen
} from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { api } from '@/lib/trpc'
import { Difficulty } from '@prisma/client'

const formSchema = z.object({
  title: z.string().min(5, '标题至少5个字符'),
  titleEn: z.string().optional(),
  description: z.string().min(50, '描述至少50个字符'),
  descriptionEn: z.string().optional(),
  maxStudents: z.number().min(1).max(10),
  field: z.string().min(1, '请选择研究领域'),
  difficulty: z.nativeEnum(Difficulty),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prerequisites: z.array(z.string()).min(1, '至少添加一个前置要求'),
  expectedOutcomes: z.array(z.string()).min(1, '至少添加一个预期成果'),
})

type FormData = z.infer<typeof formSchema>

export default function CreateTopicPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [prerequisite, setPrerequisite] = useState('')
  const [outcome, setOutcome] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      maxStudents: 1,
      field: '',
      difficulty: 'INTERMEDIATE',
      attachmentUrl: '',
      startDate: '',
      endDate: '',
      prerequisites: [],
      expectedOutcomes: [],
    },
  })

  const prerequisites = watch('prerequisites') || []
  const expectedOutcomes = watch('expectedOutcomes') || []

  const createTopic = api.topic.create.useMutation({
    onSuccess: (data) => {
      router.push(`/topics/${data.topic.id}`)
    },
    onError: (error) => {
      alert(error.message)
    },
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

  const onSubmit = (data: FormData) => {
    createTopic.mutate({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    })
  }

  const addPrerequisite = () => {
    if (prerequisite.trim()) {
      setValue('prerequisites', [...prerequisites, prerequisite.trim()])
      setPrerequisite('')
    }
  }

  const removePrerequisite = (index: number) => {
    setValue('prerequisites', prerequisites.filter((_, i) => i !== index))
  }

  const addOutcome = () => {
    if (outcome.trim()) {
      setValue('expectedOutcomes', [...expectedOutcomes, outcome.trim()])
      setOutcome('')
    }
  }

  const removeOutcome = (index: number) => {
    setValue('expectedOutcomes', expectedOutcomes.filter((_, i) => i !== index))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/topics">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              返回课题列表
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">发布新课题</CardTitle>
            <CardDescription>
              填写课题信息，发布后学生可以申请加入您的研究项目
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">课题标题 *</Label>
                    <Input
                      id="title"
                      placeholder="请输入课题标题"
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">英文标题</Label>
                    <Input
                      id="titleEn"
                      placeholder="English title (optional)"
                      {...register('titleEn')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">课题描述 *</Label>
                  <Textarea
                    id="description"
                    placeholder="详细描述课题内容、研究目标和方法..."
                    className="min-h-[120px]"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">英文描述</Label>
                  <Textarea
                    id="descriptionEn"
                    placeholder="English description (optional)"
                    className="min-h-[120px]"
                    {...register('descriptionEn')}
                  />
                </div>
              </div>

              <Separator />

              {/* Topic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">课题设置</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field">研究领域 *</Label>
                    <Select 
                      onValueChange={(value) => setValue('field', value)}
                      defaultValue=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择领域" />
                      </SelectTrigger>
                      <SelectContent>
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
                    {errors.field && (
                      <p className="text-sm text-red-500">{errors.field.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">难度等级 *</Label>
                    <Select 
                      onValueChange={(value) => setValue('difficulty', value as Difficulty)}
                      defaultValue="INTERMEDIATE"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">初级</SelectItem>
                        <SelectItem value="INTERMEDIATE">中级</SelectItem>
                        <SelectItem value="ADVANCED">高级</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">最大招生人数 *</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      min="1"
                      max="10"
                      defaultValue="1"
                      {...register('maxStudents', { valueAsNumber: true })}
                    />
                    {errors.maxStudents && (
                      <p className="text-sm text-red-500">{errors.maxStudents.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">开始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">结束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachmentUrl">附件链接</Label>
                  <Input
                    id="attachmentUrl"
                    type="url"
                    placeholder="https://..."
                    {...register('attachmentUrl')}
                  />
                  {errors.attachmentUrl && (
                    <p className="text-sm text-red-500">请输入有效的URL</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Prerequisites */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  前置要求 *
                </h3>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="添加前置要求..."
                    value={prerequisite}
                    onChange={(e) => setPrerequisite(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addPrerequisite()
                      }
                    }}
                  />
                  <Button type="button" onClick={addPrerequisite}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {prerequisites.map((req, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{req}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrerequisite(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">尚未添加前置要求</p>
                )}
                {errors.prerequisites && (
                  <p className="text-sm text-red-500">{errors.prerequisites.message}</p>
                )}
              </div>

              <Separator />

              {/* Expected Outcomes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  预期成果 *
                </h3>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="添加预期成果..."
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addOutcome()
                      }
                    }}
                  />
                  <Button type="button" onClick={addOutcome}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {expectedOutcomes.length > 0 ? (
                  <ul className="space-y-2">
                    {expectedOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{outcome}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOutcome(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">尚未添加预期成果</p>
                )}
                {errors.expectedOutcomes && (
                  <p className="text-sm text-red-500">{errors.expectedOutcomes.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={createTopic.isLoading}
                className="bg-[#005BAC] hover:bg-[#004a8c]"
              >
                {createTopic.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    发布课题
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}