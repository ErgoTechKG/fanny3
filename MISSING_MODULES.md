# HUST科研管理平台 - 缺失模块详细说明

> 本文档详细记录了HUST科研管理平台当前缺失的功能模块，包括功能需求、技术方案和实现建议。

## 📊 完成度概览

- **整体完成度**: 30%
- **核心功能完成度**: 20%
- **UI框架完成度**: 80%
- **数据模型完成度**: 90%

## 🔴 高优先级模块

### 1. 课题管理模块 (Topic Management)

#### 功能需求
- **课题发布** (Professor端)
  - 创建课题表单：标题、描述、研究方向、先修要求、预期成果
  - 富文本编辑器支持
  - 附件上传（PDF文档）
  - 招募人数设置
  - 开始/结束时间设定

- **课题浏览** (Student端)
  - 课题列表展示（卡片/列表视图切换）
  - 多维度筛选：研究方向、导师、状态、关键词
  - 排序功能：发布时间、热度、匹配度
  - 课题详情页面

- **申请系统**
  - 在线申请表单
  - 个人陈述提交
  - 简历附件上传
  - 申请状态跟踪

- **双选确认**
  - 导师审核申请列表
  - 批量处理功能
  - 学生确认接受/拒绝
  - 自动通知机制

#### 技术实现方案
```typescript
// API路由设计
- POST   /api/topics/create
- GET    /api/topics/list
- GET    /api/topics/:id
- POST   /api/topics/:id/apply
- PUT    /api/topics/:id/application/:appId/status
- GET    /api/topics/applications (学生查看自己的申请)
- GET    /api/topics/my-topics (导师查看自己的课题)
```

#### UI组件需求
- TopicForm组件（创建/编辑课题）
- TopicCard组件（课题卡片展示）
- TopicFilter组件（筛选器）
- ApplicationDialog组件（申请对话框）
- ApplicationList组件（申请管理）

### 2. 科研进度跟踪模块 (Progress Tracking)

#### 功能需求
- **进度节点管理**
  - 标准化6个节点：文献调研、开题报告、实验设计、数据收集、阶段总结、成果产出
  - 自定义节点支持
  - 节点完成度百分比
  - 预计/实际完成时间

- **进度报告**
  - 周报/月报模板
  - Markdown编辑器
  - 图片/文件附件
  - 版本历史记录

- **可视化展示**
  - 甘特图（项目整体进度）
  - 时间线（个人进度历史）
  - 进度对比图（多项目对比）

- **预警系统**
  - 自动检测延期风险
  - 红黄绿灯状态显示
  - 邮件/站内信提醒
  - 导师干预机制

#### 数据模型扩展
```prisma
model Milestone {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  description String?
  plannedDate DateTime
  actualDate  DateTime?
  progress    Int      @default(0)
  status      MilestoneStatus
  order       Int
  
  project     Project  @relation(fields: [projectId], references: [id])
}

model ProgressReport {
  id          String   @id @default(cuid())
  projectId   String
  content     String   @db.Text
  attachments Json?
  reportType  ReportType
  createdAt   DateTime @default(now())
  
  project     Project  @relation(fields: [projectId], references: [id])
}
```

## 🟡 中优先级模块

### 3. 成果管理系统 (Achievement System)

#### 功能需求
- **成果录入**
  - 分类表单：论文、专利、软著、竞赛
  - 必填/选填字段验证
  - 文件上传（原文PDF、证书扫描件）
  - 共同作者管理

- **认证流程**
  - 导师初审
  - 秘书复核
  - 管理员终审
  - 驳回修改流程

- **成果展示**
  - 个人成果主页
  - 院系成果墙
  - 成果搜索引擎
  - 引用统计

#### API设计
```typescript
// 成果相关API
- POST   /api/achievements/create
- PUT    /api/achievements/:id
- POST   /api/achievements/:id/verify
- GET    /api/achievements/my
- GET    /api/achievements/public
- GET    /api/achievements/statistics
```

### 4. 评价体系模块 (Evaluation System)

#### 功能需求
- **四维度评价**
  ```
  思想品德(10%): 政治素养、道德品质、团队协作
  学业成绩(40%): GPA、排名、核心课程
  科技创新(30%): 论文、专利、竞赛
  科研推进(20%): 项目完成度、导师评价
  ```

- **评价录入**
  - 定期评价（每学期）
  - 多角色参与（自评、导师评、同行评）
  - 证明材料上传

- **自动计算**
  - 权重配置管理
  - 分数自动汇总
  - 等级自动判定
  - 历史趋势分析

### 5. 数据可视化看板 (Data Dashboard)

#### 学生看板设计
```typescript
// 组件列表
- ResearchRadarChart     // 科研能力雷达图
- ProgressTimeline       // 项目进度时间线  
- AchievementStats       // 成果统计卡片
- TaskCalendar          // 待办日历
- CompetencyTrend       // 能力成长曲线
```

#### 导师看板设计
```typescript
// 组件列表
- StudentOverviewTable   // 学生概览表格
- ProjectGanttChart     // 多项目甘特图
- AchievementComparison // 成果对比图
- AlertsPanel           // 预警面板
- WorkloadAnalysis      // 工作量分析
```

### 6. 表单自动化系统 (Form Automation)

#### 8类核心表单
1. **导师信息表**
   - 基本信息、研究方向、招生计划
   - 年度更新机制

2. **学生选择导师意向书**
   - 三个志愿选择
   - 个人陈述
   - 推荐信上传

3. **个性化培养方案**
   - 课程计划
   - 研究计划
   - 导师签字确认

4. **实验室轮转报名与结果**
   - 轮转申请
   - 实验室反馈
   - 最终去向

5. **课程评价表**
   - 5维度评分
   - 文字反馈
   - 匿名提交

6. **综合素质评价表**
   - 四维度打分
   - 证明材料
   - 多级审核

7. **项目申报书**
   - 结构化模板
   - 预算编制
   - 进度计划

8. **成果汇总表**
   - 自动聚合
   - 分类统计
   - 导出报表

#### 技术方案
```typescript
// 动态表单引擎
interface FormSchema {
  id: string
  title: string
  fields: FormField[]
  validation: ValidationRule[]
  workflow: WorkflowStep[]
}

// 使用 react-hook-form + zod 实现
```

## 🟢 低优先级模块

### 7. 实验室轮转管理 (Lab Rotation)
- 实验室信息数据库
- 在线预约系统
- 评价反馈机制

### 8. 科研技能学习系统 (Skill Learning)
- 课程内容CMS
- 视频播放器集成
- 进度跟踪与证书

### 9. 通知系统 (Notification)
- WebSocket实时推送
- 消息中心UI
- 通知偏好设置

### 10. 报表生成 (Report Generation)
- 模板引擎集成
- PDF生成服务
- 定时任务调度

## 🛠 技术栈建议

### 前端技术
- **表单处理**: react-hook-form + zod
- **数据表格**: @tanstack/react-table
- **图表库**: recharts + visx
- **编辑器**: @tiptap/react (富文本) + @uiw/react-md-editor (Markdown)
- **文件上传**: react-dropzone + uploadthing
- **日期处理**: date-fns + react-day-picker

### 后端技术
- **任务队列**: bullmq
- **邮件服务**: resend 或 nodemailer
- **文件存储**: S3兼容存储 或 本地存储
- **PDF生成**: puppeteer 或 react-pdf
- **定时任务**: node-cron

### 数据库优化
- 添加必要的索引
- 实现软删除机制
- 添加审计日志表
- 优化查询性能

## 📈 工作量评估

| 模块 | 预计人天 | 复杂度 | 依赖关系 |
|------|---------|--------|----------|
| 课题管理 | 10-12 | 高 | 无 |
| 进度跟踪 | 8-10 | 高 | 课题管理 |
| 成果管理 | 6-8 | 中 | 无 |
| 评价体系 | 6-8 | 中 | 成果管理 |
| 数据看板 | 8-10 | 中 | 所有数据模块 |
| 表单自动化 | 10-12 | 高 | 无 |
| 实验室轮转 | 4-5 | 低 | 无 |
| 技能学习 | 4-5 | 低 | 无 |
| 通知系统 | 3-4 | 低 | 无 |
| 报表生成 | 3-4 | 低 | 所有模块 |

**总计**: 约62-78人天

## 🎯 质量标准

1. **代码质量**
   - TypeScript严格模式无错误
   - ESLint规则全部通过
   - 单元测试覆盖率>80%

2. **用户体验**
   - 页面加载时间<3秒
   - 所有操作有loading状态
   - 错误信息友好明确
   - 移动端完美适配

3. **安全性**
   - 输入验证与消毒
   - CSRF保护
   - 权限严格控制
   - 敏感数据加密

4. **可维护性**
   - 完整的代码注释
   - 清晰的目录结构
   - 模块化设计
   - 完善的文档

---

_最后更新: 2025-07-18_