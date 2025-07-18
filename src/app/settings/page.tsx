'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { api } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import { 
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  Download,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Theme, NotificationFrequency } from '@prisma/client'

const profileSchema = z.object({
  name: z.string().min(2, '姓名至少2字'),
  nameEn: z.string().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional().or(z.literal('')),
  department: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, '密码至少6位'),
  newPassword: z.string().min(6, '新密码至少6位'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '新密码与确认密码不匹配',
  path: ['confirmPassword'],
})

type ProfileInput = z.infer<typeof profileSchema>
type PasswordInput = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: settings, refetch: refetchSettings } = api.settings.getUserSettings.useQuery()
  const { data: notificationCategories } = api.settings.getNotificationCategories.useQuery()

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: settings?.profile?.name || '',
      nameEn: settings?.profile?.nameEn || '',
      phone: settings?.profile?.phone || '',
      department: settings?.profile?.department || '',
    },
  })

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const updateProfileMutation = api.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '个人信息已更新',
      })
      refetchSettings()
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateSettingsMutation = api.settings.updateUserSettings.useMutation({
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '设置已保存',
      })
      refetchSettings()
    },
  })

  const updateNotificationsMutation = api.settings.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '通知设置已更新',
      })
      refetchSettings()
    },
  })

  const changePasswordMutation = api.settings.changePassword.useMutation({
    onSuccess: () => {
      toast({
        title: '修改成功',
        description: '密码已成功修改',
      })
      setShowPasswordDialog(false)
      passwordForm.reset()
    },
    onError: (error) => {
      toast({
        title: '修改失败',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const testNotificationMutation = api.settings.testNotificationSettings.useMutation({
    onSuccess: (data) => {
      toast({
        title: '发送成功',
        description: data.message,
      })
    },
  })

  const exportDataMutation = api.settings.exportUserData.useMutation({
    onSuccess: (data) => {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: '导出成功',
        description: '您的数据已成功导出',
      })
    },
  })

  if (status === 'loading') {
    return <div>加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const onUpdateProfile = (data: ProfileInput) => {
    updateProfileMutation.mutate(data)
  }

  const onChangePassword = (data: PasswordInput) => {
    changePasswordMutation.mutate(data)
  }

  // Update form values when settings load
  if (settings?.profile) {
    profileForm.reset({
      name: settings.profile.name || '',
      nameEn: settings.profile.nameEn || '',
      phone: settings.profile.phone || '',
      department: settings.profile.department || '',
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-600 mt-1">
            管理您的账户设置和偏好
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              通知设置
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              偏好设置
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              安全与隐私
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>
                  更新您的个人信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>英文名（可选）</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>手机号</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>院系（可选）</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        保存更改
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>
                  您的账户基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>邮箱</Label>
                  <p className="text-sm text-gray-600">{settings?.profile?.email}</p>
                </div>
                {settings?.profile?.studentId && (
                  <div>
                    <Label>学号</Label>
                    <p className="text-sm text-gray-600">{settings.profile.studentId}</p>
                  </div>
                )}
                <div>
                  <Label>角色</Label>
                  <div className="flex gap-2 mt-1">
                    {settings?.profile?.roles.map((role) => (
                      <span key={role.role} className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {role.role === 'STUDENT' ? '学生' :
                         role.role === 'PROFESSOR' ? '导师' :
                         role.role === 'SECRETARY' ? '科研秘书' : '管理员'}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>通知渠道</CardTitle>
                <CardDescription>
                  选择您希望接收通知的方式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      邮件通知
                    </Label>
                    <p className="text-sm text-gray-500">
                      通过邮件接收重要通知
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.settings?.emailNotifications}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({
                        emailNotifications: checked,
                      })
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications" className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      推送通知
                    </Label>
                    <p className="text-sm text-gray-500">
                      在浏览器中接收推送通知
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings?.settings?.pushNotifications}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({
                        pushNotifications: checked,
                      })
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="wechat-notifications" className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      企业微信通知
                    </Label>
                    <p className="text-sm text-gray-500">
                      通过企业微信接收通知
                    </p>
                  </div>
                  <Switch
                    id="wechat-notifications"
                    checked={settings?.settings?.wechatNotifications}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({
                        wechatNotifications: checked,
                      })
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>通知频率</CardTitle>
                <CardDescription>
                  设置接收通知的频率
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={settings?.settings?.notificationFrequency}
                  onValueChange={(value) => {
                    updateNotificationsMutation.mutate({
                      notificationFrequency: value as NotificationFrequency,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">立即通知</SelectItem>
                    <SelectItem value="DAILY">每日汇总</SelectItem>
                    <SelectItem value="WEEKLY">每周汇总</SelectItem>
                    <SelectItem value="NEVER">从不</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>通知类别</CardTitle>
                <CardDescription>
                  选择您想要接收的通知类型
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationCategories?.map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div>
                        <Label>{category.name}</Label>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                      <Switch defaultChecked={category.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => testNotificationMutation.mutate({ type: 'email' })}
              >
                测试邮件通知
              </Button>
              <Button
                variant="outline"
                onClick={() => testNotificationMutation.mutate({ type: 'push' })}
              >
                测试推送通知
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>界面设置</CardTitle>
                <CardDescription>
                  自定义界面外观
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>主题</Label>
                  <Select 
                    value={settings?.settings?.theme}
                    onValueChange={(value) => {
                      updateSettingsMutation.mutate({ theme: value as Theme })
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIGHT">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          浅色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="DARK">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          深色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="SYSTEM">
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          跟随系统
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>语言</Label>
                  <Select 
                    value={settings?.settings?.language}
                    onValueChange={(value) => {
                      updateSettingsMutation.mutate({ language: value })
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">中文（简体）</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>时区</Label>
                  <Select 
                    value={settings?.settings?.timezone}
                    onValueChange={(value) => {
                      updateSettingsMutation.mutate({ timezone: value })
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                      <SelectItem value="America/New_York">美国东部时间</SelectItem>
                      <SelectItem value="Europe/London">英国时间</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>密码管理</CardTitle>
                <CardDescription>
                  定期更改密码以保护账户安全
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowPasswordDialog(true)}>
                  修改密码
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>数据管理</CardTitle>
                <CardDescription>
                  导出或删除您的账户数据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">导出数据</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    下载您的所有账户数据副本
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出数据
                  </Button>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">危险区域</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    删除账户将永久清除您的所有数据，此操作不可恢复
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除账户
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>修改密码</DialogTitle>
              <DialogDescription>
                请输入当前密码和新密码
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认新密码</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordDialog(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={changePasswordMutation.isLoading}>
                    确认修改
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除账户</DialogTitle>
              <DialogDescription>
                此操作将永久删除您的账户和所有相关数据，且不可恢复。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-red-600">
                警告：删除账户后，您将失去所有研究项目、申请记录、成就和其他数据。
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // In a real implementation, this would require password confirmation
                  toast({
                    title: '功能暂未开放',
                    description: '账户删除功能正在开发中',
                  })
                  setShowDeleteDialog(false)
                }}
              >
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}