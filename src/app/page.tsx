import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, TrendingUp, Award, FileText, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#005BAC] rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HUST科研管理平台</h1>
                <p className="text-xs text-gray-600">华中科技大学</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">登录</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#005BAC] hover:bg-[#004a8c]">注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            创新引领未来，科研成就梦想
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            为启明班和创新班学生打造的一站式科研管理平台
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-[#005BAC] hover:bg-[#004a8c]">
                立即开始
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃学生</CardTitle>
              <Users className="h-4 w-4 text-[#005BAC]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,200+</div>
              <p className="text-xs text-gray-600">启明班与创新班学生</p>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">研究项目</CardTitle>
              <FileText className="h-4 w-4 text-[#005BAC]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">350+</div>
              <p className="text-xs text-gray-600">正在进行的课题</p>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">导师团队</CardTitle>
              <GraduationCap className="h-4 w-4 text-[#005BAC]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120+</div>
              <p className="text-xs text-gray-600">资深教授与研究员</p>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">科研成果</CardTitle>
              <Award className="h-4 w-4 text-[#005BAC]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">800+</div>
              <p className="text-xs text-gray-600">论文与专利</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">核心功能模块</h3>
          <p className="text-lg text-gray-600">全方位支持科研培养全流程管理</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>课题管理</CardTitle>
              <CardDescription>
                发布课题、学生申请、导师审核、课题分配全流程管理
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>进度跟踪</CardTitle>
              <CardDescription>
                实时监控科研进度，支持里程碑管理和进度报告
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>成果管理</CardTitle>
              <CardDescription>
                论文、专利、获奖等科研成果的登记与展示
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>评价体系</CardTitle>
              <CardDescription>
                多维度评价指标，支持导师评价和同行评议
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>团队协作</CardTitle>
              <CardDescription>
                支持团队项目管理，促进交流与合作
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#005BAC]" />
              </div>
              <CardTitle>表单自动化</CardTitle>
              <CardDescription>
                8类关键表单的自动生成与流程管理
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#005BAC] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">准备开启您的科研之旅？</h3>
          <p className="text-xl mb-8">加入HUST科研管理平台，让科研管理更高效</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                立即注册
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-[#005BAC]">
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© 2024 华中科技大学科研管理平台 版权所有</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="#" className="hover:text-white">使用条款</Link>
              <Link href="#" className="hover:text-white">隐私政策</Link>
              <Link href="#" className="hover:text-white">联系我们</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}