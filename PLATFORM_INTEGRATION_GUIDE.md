# 华中科技大学科研管理平台 - 完整集成开发指南

## 目录
1. [项目总览](#1-项目总览)
2. [设计方案解读](#2-设计方案解读)
3. [材料文件映射](#3-材料文件映射)
4. [当前实现状态](#4-当前实现状态)
5. [详细开发计划](#5-详细开发计划)
6. [技术实现方案](#6-技术实现方案)
7. [数据迁移策略](#7-数据迁移策略)
8. [测试与部署](#8-测试与部署)

---

## 1. 项目总览

### 1.1 项目背景
华中科技大学机械科学与工程学院需要一个综合性的科研管理平台，用于管理：
- **启明实验班**：跨学科创新人才培养
- **机械卓越工程师班（机卓班）**：工程实践能力培养
- **本硕博贯通班**：学术研究能力培养

### 1.2 核心目标
根据《华中科技大学科研管理平台设计方案.docx》，平台需要实现：
1. **流程自动化**：将现有Excel表格和Word文档流程数字化
2. **数据标准化**：统一数据格式，实现数据互通
3. **智能化管理**：基于数据分析提供决策支持
4. **协同工作**：多角色协同，提高管理效率

### 1.3 用户规模
- 每年级约100-150名实验班学生
- 50+名导师
- 10+名管理人员
- 累计用户约1000人

---

## 2. 设计方案解读

### 2.1 功能模块（基于设计方案）

#### 核心功能模块
1. **用户管理与认证**
   - 四种角色：学生、导师、科研秘书、管理员
   - 支持多重身份（如既是导师又是管理员）

2. **课题管理**
   - 导师发布课题
   - 学生申请流程
   - 双向选择机制
   - 智能匹配系统

3. **进度管理**
   - 科研日志系统
   - 标准化进度节点
   - 自动预警系统
   - 导师批注反馈

4. **成果管理**
   - 成果提交与认证
   - 多类型支持（论文、专利、竞赛等）
   - 统计分析功能

5. **评价系统**
   - 四维度综合评价
   - 自动计算排名
   - 历史数据追踪

6. **数据分析**
   - 个人成长看板
   - 管理统计面板
   - 趋势分析报告

### 2.2 附件2：需要自动化的表格梳理

设计方案的附件2详细说明了需要自动化的8类表格，这些表格对应doc-materials中的具体文件：

#### 2.2.1 导师信息表
**用途**：收集和管理导师基本信息、研究方向、指导能力
**对应材料**：
- `实验班学业导师文件/机械科学与工程学院本科生学业导师制实施办法-附件表格汇总.doc`
- `实验班学业导师文件/机械学院2023级实验班学生导师配备情况一览表.xlsx`
- `实验班学业导师文件/附件 启明学院2024级实验班学生导师选聘情况一览表.xls`

**字段要求**：
```javascript
{
  基本信息: {
    姓名: string,
    工号: string,
    职称: string,
    所属院系: string,
    联系方式: {
      电话: string,
      邮箱: string,
      办公地点: string
    }
  },
  学术信息: {
    研究方向: string[],
    研究成果: string[],
    在研项目: string[],
    代表性论文: string[]
  },
  指导信息: {
    可指导学生数: number,
    已指导学生数: number,
    指导要求: string,
    擅长领域: string[]
  }
}
```

#### 2.2.2 学生选择导师意向书
**用途**：学生填报导师志愿，实现双向选择
**对应材料**：
- `实验班学业导师文件/` 目录下的相关文件

**字段要求**：
```javascript
{
  学生信息: {
    姓名: string,
    学号: string,
    年级: string,
    班级: string,
    GPA: number,
    联系方式: string
  },
  志愿信息: {
    第一志愿: {
      导师姓名: string,
      选择理由: string
    },
    第二志愿: {
      导师姓名: string,
      选择理由: string
    },
    第三志愿: {
      导师姓名: string,
      选择理由: string
    }
  },
  个人陈述: {
    研究兴趣: string,
    个人优势: string,
    学习计划: string,
    职业规划: string
  }
}
```

#### 2.2.3 个性化培养方案
**用途**：为每个学生制定个性化的培养计划
**对应材料**：
- `本研贯通实验班培养计划建议.docx`
- `副本（2024年）本研贯通-培养计划修订专项培训-培养目标-毕业要求-课程支撑关系样表（机械案例.xlsx`
- `副本（2024年）机卓-培养计划修订专项培训-培养目标-毕业要求-课程支-0820-张俐.xlsx`

**内容模块**：
```javascript
{
  基本信息: {
    学生姓名: string,
    学号: string,
    导师: string,
    制定日期: Date
  },
  培养目标: {
    总体目标: string,
    阶段目标: [{
      阶段: string,
      目标: string,
      时间: string
    }]
  },
  课程计划: {
    必修课程: [{
      课程名称: string,
      学分: number,
      建议学期: string
    }],
    选修课程: [{
      课程名称: string,
      学分: number,
      方向: string
    }]
  },
  科研计划: {
    研究方向: string,
    预期成果: string[],
    时间安排: string
  },
  实践计划: {
    实验室轮转: string,
    企业实习: string,
    创新项目: string
  }
}
```

#### 2.2.4 实验室轮转报名与结果
**用途**：管理学生实验室轮转申请和分配
**对应材料**：
- `实验室轮转答辩流程-20241230.doc`
- `实验室轮转答辩评分表-20241229.xlsx`
- `（模板&参考资料）实验班办学成效总结报告 2023.11(1)/2 实验室轮转/` 目录

**流程数据**：
```javascript
{
  申请信息: {
    学生信息: {...},
    志愿选择: [{
      志愿顺序: number,
      实验室名称: string,
      导师姓名: string,
      申请理由: string
    }],
    时间偏好: string
  },
  分配结果: {
    分配实验室: string,
    轮转时间: {
      开始: Date,
      结束: Date
    },
    指导教师: string,
    轮转任务: string[]
  },
  轮转记录: {
    出勤情况: string,
    工作日志: [{
      日期: Date,
      内容: string
    }],
    总结报告: string
  },
  评价结果: {
    学生自评: string,
    导师评价: string,
    答辩成绩: {
      汇报内容: number,
      创新性: number,
      完成度: number,
      表达能力: number,
      总分: number
    }
  }
}
```

#### 2.2.5 课程评价表
**用途**：收集学生对课程的评价反馈
**对应材料**：
- `实验班评教情况.xlsx`
- `模块化课程摸底.xlsx`

**评价维度**：
```javascript
{
  课程信息: {
    课程名称: string,
    任课教师: string,
    学期: string
  },
  评价内容: {
    教学质量: {
      内容深度: number, // 1-5分
      逻辑清晰: number,
      案例丰富: number
    },
    教师表现: {
      授课水平: number,
      互动效果: number,
      答疑情况: number
    },
    课程设置: {
      难度适中: number,
      实践比例: number,
      考核方式: number
    }
  },
  建议反馈: {
    改进建议: string,
    最满意方面: string,
    最需改进方面: string
  }
}
```

#### 2.2.6 综合素质评价表
**用途**：实施四维度综合素质评价
**对应材料**：
- `2024年综合素质评价方案及标准-过审版/` 整个目录
- `2024年实验班综合素质评价评分汇总表-2021级.xlsx`
- `2024年实验班综合素质评价评分汇总表0925.xlsx`

**评价体系**：
```javascript
{
  基本信息: {
    学生姓名: string,
    学号: string,
    年级: string,
    班级: string,
    评价学期: string
  },
  四维度评分: {
    思想品德: {
      基础分: 60,
      加分项: [{
        项目: string,
        分值: number,
        证明材料: string
      }],
      扣分项: [{
        项目: string,
        分值: number,
        说明: string
      }],
      得分: number,
      权重: 0.1
    },
    学业成绩: {
      GPA: number,
      GPA标准分: number, // (个人GPA/年级最高GPA)*100
      核心课程均分: number,
      学术活动分: number,
      得分: number,
      权重: 0.4
    },
    科技创新: {
      论文发表: [{...}],
      专利授权: [{...}],
      竞赛获奖: [{...}],
      创新项目: [{...}],
      得分: number,
      权重: 0.3
    },
    科研推进: {
      项目进度: number,
      日志质量: number,
      导师评价: number,
      得分: number,
      权重: 0.2
    }
  },
  总评: {
    总分: number,
    排名: number,
    等级: string // 优秀/良好/合格/不合格
  }
}
```

#### 2.2.7 项目申报书
**用途**：学生申报创新项目或企业项目
**对应材料**：
- `机械学院本科生自然科学基金申请/` 目录
- `2024大创项目升级申报书(1).zip` 中的文件
- `创新项目实践课程资料.zip` 中的申报模板

**申报内容**：
```javascript
{
  项目基本信息: {
    项目名称: string,
    项目类型: string, // 创新项目/企业项目
    申请人: string,
    指导教师: string,
    合作企业: string, // 企业项目需要
    项目周期: string
  },
  项目内容: {
    研究背景: string,
    研究意义: string,
    研究内容: string,
    技术路线: string,
    创新点: string[],
    预期成果: [{
      成果类型: string,
      成果名称: string,
      完成时间: string
    }]
  },
  实施计划: {
    进度安排: [{
      阶段: string,
      任务: string,
      时间: string,
      交付物: string
    }],
    人员分工: [{
      姓名: string,
      职责: string
    }]
  },
  经费预算: {
    总预算: number,
    明细: [{
      项目: string,
      金额: number,
      用途: string
    }]
  }
}
```

#### 2.2.8 成果汇总表
**用途**：统计和展示学生的各类成果
**对应材料**：
- `（模板&参考资料）实验班办学成效总结报告 2023.11(1)/8 特优生/` 目录下的成果汇总表
- `机械学院国家级大创结题优秀项目/` 目录

**成果分类**：
```javascript
{
  学生信息: {...},
  成果统计: {
    论文发表: [{
      论文题目: string,
      期刊/会议: string,
      级别: string, // SCI/EI/核心等
      作者排序: number,
      发表时间: Date,
      DOI: string
    }],
    专利授权: [{
      专利名称: string,
      专利类型: string, // 发明/实用新型/外观
      专利号: string,
      发明人排序: number,
      授权时间: Date
    }],
    竞赛获奖: [{
      竞赛名称: string,
      获奖等级: string,
      获奖时间: Date,
      团队成员: string[],
      指导教师: string
    }],
    软件著作权: [{
      软件名称: string,
      登记号: string,
      完成时间: Date
    }],
    其他成果: [{
      成果类型: string,
      成果名称: string,
      成果描述: string
    }]
  },
  成果评分: {
    总分: number,
    排名: number
  }
}
```

---

## 3. 材料文件映射

### 3.1 学业导师制相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `实验班学业导师文件/机械科学与工程学院本科生学业导师制实施办法*.doc` | 导师管理模块 | 导师制度规范 |
| `实验班学业导师文件/*导师配备情况一览表.xls` | 导师信息表 | 导师数据导入 |
| `实验班学业导师文件/22级实验班 本科阶段学业导师制 实施方案.pptx` | 系统帮助文档 | 流程说明 |

### 3.2 创新项目实践相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `创新项目实践课程中期报告/*.docx` | 进度管理-中期检查 | 报告模板 |
| `创新项目实践课程中期报告/*评分表.xlsx` | 评价系统 | 评分标准 |
| `2025年1月课程中期检查/` | 进度管理 | 检查要求 |

### 3.3 企业项目实践相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `企业项目实践-任务书/*/*.docx` | 课题管理-任务书 | 任务书模板和实例 |
| `企业项目实践课程宣讲会内容汇总.xlsx` | 课题展示 | 项目信息 |
| `提交材料模板/` | 表单自动化 | 标准模板 |

### 3.4 综合评价相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `2024年综合素质评价方案及标准-过审版/` | 评价系统 | 评价标准和规则 |
| `2024年实验班综合素质评价评分汇总表*.xlsx` | 评价数据 | 历史数据导入 |

### 3.5 实验室轮转相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `实验室轮转答辩流程-20241230.doc` | 轮转管理-答辩 | 答辩流程 |
| `实验室轮转答辩评分表-20241229.xlsx` | 轮转评价 | 评分标准 |
| `（模板&参考资料）*/2 实验室轮转/` | 轮转管理 | 历史数据和经验 |

### 3.6 培养方案相关
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `本研贯通实验班培养计划建议.docx` | 培养方案管理 | 方案模板 |
| `副本（2024年）*培养计划修订*.xlsx` | 课程管理 | 课程体系 |
| `本硕贯通+机卓课程安排-0325.pptx` | 课程安排 | 课程计划 |

### 3.7 其他重要材料
| 材料文件 | 对应功能模块 | 数据用途 |
|---------|-------------|---------|
| `近三年本科生参加大创项目情况.xlsx` | 数据分析 | 历史统计 |
| `2024智能机器人赛-HUST队伍清单6月(1).xlsx` | 竞赛管理 | 竞赛记录 |
| `2025届本硕博实验班毕业去向统计表*.xls` | 就业分析 | 去向统计 |

---

## 4. 当前实现状态

### 4.1 已完成功能（约25%）

#### 基础架构 ✅
- Next.js 14 + TypeScript环境搭建
- PostgreSQL数据库配置
- Prisma ORM集成
- 基础UI组件库（shadcn/ui）
- NextAuth认证系统

#### 页面实现情况
| 页面 | 路由 | 完成度 | 说明 |
|------|-----|--------|-----|
| 首页 | `/` | 90% | 基础框架完成 |
| 登录 | `/login` | 90% | 缺少手机号登录 |
| 注册 | `/register` | 80% | 缺少验证码 |
| Dashboard | `/dashboard` | 60% | 基础框架，缺少数据 |
| 课题列表 | `/topics` | 50% | 仅展示功能 |
| 成就页面 | `/achievements` | 40% | 框架完成 |
| 进度管理 | `/progress` | 10% | 仅页面框架 |
| 日历 | `/calendar` | 10% | 仅页面框架 |
| 设置 | `/settings` | 10% | 仅页面框架 |

#### 数据库模型
当前schema.prisma中已定义的模型：
- User（用户）✅
- UserRole（用户角色）✅
- Topic（课题）⚠️ 缺少企业项目字段
- Application（申请）⚠️ 缺少双向确认
- Project（项目）✅
- Progress（进度）⚠️ 缺少4周总结
- Achievement（成果）⚠️ 缺少详细分类
- Evaluation（评价）⚠️ 缺少支撑材料
- ResearchLog（科研日志）✅
- ProjectMilestone（项目里程碑）✅
- Event（事件）✅
- UserSettings（用户设置）✅

### 4.2 缺失的核心功能

#### 1. 学业导师管理系统 ❌
- 导师信息管理
- 三志愿申请系统
- 双向选择匹配算法
- 师生关系管理

#### 2. 完整的课题管理 ❌
- 创新项目vs企业项目分类
- 完整的申请流程
- 任务书管理
- 课题状态流转

#### 3. 进度管理系统 ❌
- 每日/每周日志
- 4周进展总结
- 标准化里程碑（6个阶段）
- 预警系统（红黄绿）
- 导师批注系统

#### 4. 实验室轮转管理 ❌
- 实验室信息库
- 轮转申请（3志愿）
- 轮转安排算法
- 轮转日志
- 答辩管理

#### 5. 综合评价系统 ❌
- 四维度评价实现
- 支撑材料管理
- 自动计算和排名
- 公示和申诉流程

#### 6. 表单自动化引擎 ❌
- 8类表单模板
- 动态表单生成
- 审批流程
- 数据导入导出

#### 7. 数据分析看板 ❌
- 学生个人看板
- 导师管理看板
- 秘书统计看板
- 管理员分析看板

---

## 5. 详细开发计划

### 5.1 第一阶段：数据库完善和基础功能（第1-2周）

#### Week 1: 数据库迁移和核心模型
```bash
# 1. 创建新的migration
npx prisma migrate dev --name add_mentor_system

# 2. 需要添加的新模型
```

```prisma
// 导师申请模型
model MentorApplication {
  id              String   @id @default(cuid())
  studentId       String
  academicYear    String   // 2024-2025
  
  firstChoiceId   String
  firstReason     String   @db.Text
  secondChoiceId  String?
  secondReason    String?  @db.Text
  thirdChoiceId   String?
  thirdReason     String?  @db.Text
  
  personalStatement String @db.Text
  researchInterest  String @db.Text
  
  status          MentorApplicationStatus @default(PENDING)
  finalMentorId   String?
  
  student         User     @relation("StudentApplications", fields: [studentId], references: [id])
  firstChoice     User     @relation("FirstChoiceMentor", fields: [firstChoiceId], references: [id])
  secondChoice    User?    @relation("SecondChoiceMentor", fields: [secondChoiceId], references: [id])
  thirdChoice     User?    @relation("ThirdChoiceMentor", fields: [thirdChoiceId], references: [id])
  finalMentor     User?    @relation("FinalMentor", fields: [finalMentorId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([studentId, academicYear])
}

// 实验室模型
model Lab {
  id              String   @id @default(cuid())
  name            String
  code            String   @unique
  directorId      String
  location        String
  capacity        Int
  
  description     String   @db.Text
  researchAreas   String[]
  equipment       String[]
  achievements    String[]
  
  director        User     @relation(fields: [directorId], references: [id])
  rotations       LabRotationApplication[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 实验室轮转申请
model LabRotationApplication {
  id              String   @id @default(cuid())
  studentId       String
  semester        String   // 2024-1
  
  choices         Json     // [{order: 1, labId: "xxx", reason: "xxx"}]
  
  assignedLabId   String?
  assignedMentor  String?
  startDate       DateTime?
  endDate         DateTime?
  
  status          RotationStatus @default(PENDING)
  
  student         User     @relation(fields: [studentId], references: [id])
  assignedLab     Lab?     @relation(fields: [assignedLabId], references: [id])
  logs            RotationLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 轮转日志
model RotationLog {
  id              String   @id @default(cuid())
  rotationId      String
  weekNumber      Int
  
  content         String   @db.Text
  problems        String[]
  achievements    String[]
  nextPlan        String?
  
  mentorFeedback  String?  @db.Text
  
  rotation        LabRotationApplication @relation(fields: [rotationId], references: [id])
  
  createdAt       DateTime @default(now())
}

// 表单模板
model FormTemplate {
  id              String   @id @default(cuid())
  name            String
  code            String   @unique
  category        FormCategory
  
  schema          Json     // 表单结构定义
  workflow        Json?    // 审批流程
  
  active          Boolean  @default(true)
  version         Int      @default(1)
  
  submissions     FormSubmission[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 表单提交
model FormSubmission {
  id              String   @id @default(cuid())
  templateId      String
  submittedBy     String
  
  data            Json     // 提交的数据
  status          SubmissionStatus @default(DRAFT)
  
  currentStep     Int      @default(0)
  approvals       Json[]   // 审批记录
  
  template        FormTemplate @relation(fields: [templateId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 更新Topic模型，支持企业项目
model Topic {
  // ... 现有字段
  
  type            TopicType @default(INNOVATION) // 新增
  companyName     String?   // 企业名称
  companyMentor   String?   // 企业导师
  taskBook        Json?     // 任务书内容
  
  // ... 其他字段
}

// 新增枚举
enum TopicType {
  INNOVATION  // 创新项目
  ENTERPRISE  // 企业项目
}

enum MentorApplicationStatus {
  PENDING
  FIRST_MATCHED
  SECOND_MATCHED
  THIRD_MATCHED
  UNMATCHED
  CONFIRMED
}

enum RotationStatus {
  PENDING
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum FormCategory {
  MENTOR_INFO
  MENTOR_APPLICATION
  TRAINING_PLAN
  LAB_ROTATION
  COURSE_EVALUATION
  QUALITY_EVALUATION
  PROJECT_PROPOSAL
  ACHIEVEMENT_SUMMARY
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  REVIEWING
  APPROVED
  REJECTED
  RETURNED
}
```

#### Week 1 开发任务清单
1. **数据库更新**（2天）
   - [ ] 更新schema.prisma添加新模型
   - [ ] 运行migration创建新表
   - [ ] 创建种子数据脚本

2. **导师管理模块**（3天）
   - [ ] 导师信息CRUD API
   - [ ] 导师列表页面
   - [ ] 导师详情页面
   - [ ] 导师申请API

3. **学生选导师功能**（2天）
   - [ ] 三志愿申请页面
   - [ ] 申请状态查询
   - [ ] 匹配算法实现

#### Week 2: 核心业务功能

1. **完善课题管理**（3天）
   - [ ] 区分创新/企业项目
   - [ ] 任务书上传和管理
   - [ ] 完整申请流程
   - [ ] 双向确认机制

2. **进度管理系统**（4天）
   - [ ] 科研日志页面
   - [ ] 每周总结功能
   - [ ] 4周进展总结
   - [ ] 里程碑管理
   - [ ] 预警系统实现

### 5.2 第二阶段：评价系统和实验室轮转（第3-4周）

#### Week 3: 综合评价系统
1. **评价框架搭建**（2天）
   - [ ] 四维度评价模型
   - [ ] 评分计算引擎
   - [ ] 支撑材料上传

2. **评价流程实现**（3天）
   - [ ] 学生自评页面
   - [ ] 导师评价页面
   - [ ] 审核和公示
   - [ ] 排名计算

#### Week 4: 实验室轮转
1. **实验室管理**（2天）
   - [ ] 实验室信息CRUD
   - [ ] 实验室展示页面
   - [ ] 容量管理

2. **轮转申请系统**（3天）
   - [ ] 三志愿申请
   - [ ] 分配算法
   - [ ] 轮转日志
   - [ ] 答辩管理

### 5.3 第三阶段：表单自动化和数据分析（第5-6周）

#### Week 5: 表单自动化引擎
1. **表单引擎开发**（3天）
   - [ ] 动态表单渲染
   - [ ] 表单验证
   - [ ] 审批流程引擎

2. **8类表单实现**（2天）
   - [ ] 创建表单模板
   - [ ] 表单预览和测试
   - [ ] 数据导出功能

#### Week 6: 数据可视化
1. **学生看板**（2天）
   - [ ] 个人数据统计
   - [ ] 成长轨迹
   - [ ] 能力雷达图

2. **管理看板**（3天）
   - [ ] 导师管理看板
   - [ ] 秘书统计看板
   - [ ] 管理员分析看板

### 5.4 第四阶段：系统完善和优化（第7-8周）

#### Week 7: 功能完善
1. **通知系统**（2天）
   - [ ] 站内通知
   - [ ] 邮件集成
   - [ ] 消息中心

2. **文件管理**（1天）
   - [ ] 文件上传优化
   - [ ] 文件预览
   - [ ] 批量下载

3. **数据导入导出**（2天）
   - [ ] Excel导入
   - [ ] 报表导出
   - [ ] PDF生成

#### Week 8: 测试和部署
1. **测试完善**（3天）
   - [ ] 单元测试
   - [ ] 集成测试
   - [ ] E2E测试

2. **部署准备**（2天）
   - [ ] 性能优化
   - [ ] 安全加固
   - [ ] 部署文档

---

## 6. 技术实现方案

### 6.1 前端技术方案

#### 路由设计
```typescript
// 新增路由
/mentors                    // 导师列表
/mentors/[id]              // 导师详情
/mentors/apply             // 申请导师

/labs                      // 实验室列表
/labs/[id]                 // 实验室详情
/labs/rotation/apply       // 轮转申请
/labs/rotation/logs        // 轮转日志

/evaluation                // 评价中心
/evaluation/self           // 自评
/evaluation/review         // 查看评价

/forms                     // 表单中心
/forms/[templateId]        // 填写表单
/forms/submissions         // 我的提交

/analytics                 // 数据分析
/analytics/personal        // 个人看板
/analytics/management      // 管理看板
```

#### 组件设计
```typescript
// 导师选择组件
interface MentorSelectionProps {
  maxChoices: number;
  onSubmit: (choices: MentorChoice[]) => void;
}

// 进度时间线组件
interface ProgressTimelineProps {
  milestones: Milestone[];
  currentProgress: number;
  alertLevel: 'green' | 'yellow' | 'red';
}

// 评价雷达图组件
interface EvaluationRadarProps {
  dimensions: {
    moral: number;
    academic: number;
    innovation: number;
    research: number;
  };
  comparison?: 'class' | 'grade';
}

// 动态表单组件
interface DynamicFormProps {
  schema: FormSchema;
  initialData?: any;
  onSubmit: (data: any) => void;
  workflow?: WorkflowConfig;
}
```

### 6.2 后端API设计

#### tRPC路由扩展
```typescript
// src/server/api/routers/mentor.ts
export const mentorRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      department: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取导师列表
    }),

  apply: protectedProcedure
    .input(z.object({
      academicYear: z.string(),
      choices: z.array(z.object({
        mentorId: z.string(),
        order: z.number(),
        reason: z.string(),
      })),
      personalStatement: z.string(),
      researchInterest: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 提交导师申请
    }),

  match: adminProcedure
    .input(z.object({
      academicYear: z.string(),
    }))
    .mutation(async ({ ctx }) => {
      // 运行匹配算法
    }),
});

// src/server/api/routers/lab.ts
export const labRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // 获取实验室列表
  }),

  applyRotation: protectedProcedure
    .input(z.object({
      semester: z.string(),
      choices: z.array(z.object({
        labId: z.string(),
        order: z.number(),
        reason: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // 提交轮转申请
    }),

  submitLog: protectedProcedure
    .input(z.object({
      rotationId: z.string(),
      weekNumber: z.number(),
      content: z.string(),
      problems: z.array(z.string()),
      achievements: z.array(z.string()),
      nextPlan: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 提交轮转日志
    }),
});

// src/server/api/routers/evaluation.ts
export const evaluationRouter = router({
  submitSelfEvaluation: protectedProcedure
    .input(z.object({
      semester: z.string(),
      moral: z.object({
        base: z.number(),
        additions: z.array(z.object({
          item: z.string(),
          score: z.number(),
          proof: z.string(),
        })),
        deductions: z.array(z.object({
          item: z.string(),
          score: z.number(),
          reason: z.string(),
        })),
      }),
      // ... 其他维度
    }))
    .mutation(async ({ ctx, input }) => {
      // 提交自评
    }),

  calculate: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      semester: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 计算综合评分
    }),
});

// src/server/api/routers/form.ts
export const formRouter = router({
  getTemplate: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取表单模板
    }),

  submit: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 提交表单
    }),

  approve: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      action: z.enum(['approve', 'reject', 'return']),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 审批表单
    }),
});
```

### 6.3 核心算法实现

#### 导师匹配算法
```typescript
interface MatchingAlgorithm {
  // 输入：学生申请列表，导师容量
  // 输出：匹配结果
  match(
    applications: MentorApplication[],
    mentorCapacities: Map<string, number>
  ): MatchingResult[];
}

class GaleShapleyMatcher implements MatchingAlgorithm {
  match(applications: MentorApplication[], capacities: Map<string, number>) {
    // 1. 初始化
    const studentPreferences = new Map(); // 学生偏好
    const mentorApplications = new Map(); // 导师收到的申请
    const matches = new Map(); // 最终匹配
    
    // 2. 第一轮：学生申请第一志愿
    for (const app of applications) {
      const mentorId = app.firstChoiceId;
      if (!mentorApplications.has(mentorId)) {
        mentorApplications.set(mentorId, []);
      }
      mentorApplications.get(mentorId).push(app);
    }
    
    // 3. 导师选择
    for (const [mentorId, apps] of mentorApplications) {
      const capacity = capacities.get(mentorId) || 0;
      // 根据GPA、个人陈述等因素排序
      const sorted = this.rankApplications(apps);
      const accepted = sorted.slice(0, capacity);
      
      for (const app of accepted) {
        matches.set(app.studentId, mentorId);
      }
    }
    
    // 4. 未匹配学生进入第二轮
    // ... 实现第二、三志愿匹配
    
    return Array.from(matches.entries()).map(([studentId, mentorId]) => ({
      studentId,
      mentorId,
      matchRound: 1, // 或2、3
    }));
  }
  
  private rankApplications(apps: MentorApplication[]) {
    return apps.sort((a, b) => {
      // 评分规则：GPA(40%) + 研究匹配度(30%) + 个人陈述(30%)
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    });
  }
}
```

#### 实验室轮转分配算法
```typescript
class LabRotationMatcher {
  assign(
    applications: LabRotationApplication[],
    labCapacities: Map<string, number>,
    rotationRounds: number = 3
  ) {
    const assignments = [];
    const labSlots = new Map(); // 实验室剩余名额
    
    // 初始化实验室容量
    for (const [labId, capacity] of labCapacities) {
      labSlots.set(labId, capacity);
    }
    
    // 按志愿顺序分配
    for (let round = 1; round <= 3; round++) {
      for (const app of applications) {
        if (app.status !== 'PENDING') continue;
        
        const choice = app.choices.find(c => c.order === round);
        if (!choice) continue;
        
        const available = labSlots.get(choice.labId) || 0;
        if (available > 0) {
          // 分配成功
          assignments.push({
            studentId: app.studentId,
            labId: choice.labId,
            round: round,
          });
          
          labSlots.set(choice.labId, available - 1);
          app.status = 'ASSIGNED';
        }
      }
    }
    
    return assignments;
  }
}
```

#### 综合评价计算引擎
```typescript
class EvaluationCalculator {
  calculate(data: EvaluationData): EvaluationResult {
    // 1. 思想品德（10%）
    const moralScore = this.calculateMoral(data.moral);
    
    // 2. 学业成绩（40%）
    const academicScore = this.calculateAcademic(data.academic);
    
    // 3. 科技创新（30%）
    const innovationScore = this.calculateInnovation(data.innovation);
    
    // 4. 科研推进（20%）
    const researchScore = this.calculateResearch(data.research);
    
    // 计算总分
    const totalScore = 
      moralScore * 0.1 +
      academicScore * 0.4 +
      innovationScore * 0.3 +
      researchScore * 0.2;
    
    return {
      moral: moralScore,
      academic: academicScore,
      innovation: innovationScore,
      research: researchScore,
      total: totalScore,
      rank: this.calculateRank(totalScore),
    };
  }
  
  private calculateMoral(moral: MoralData) {
    let score = 60; // 基础分
    
    // 加分项
    for (const addition of moral.additions) {
      score += addition.score;
    }
    
    // 扣分项
    for (const deduction of moral.deductions) {
      score -= deduction.score;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  private calculateAcademic(academic: AcademicData) {
    const gpaScore = (academic.gpa / academic.maxGpa) * 100 * 0.6;
    const coreScore = academic.coreCourseAvg * 0.3;
    const activityScore = Math.min(10, academic.activityCount * 2) * 0.1;
    
    return gpaScore + coreScore + activityScore;
  }
  
  private calculateInnovation(innovation: InnovationData) {
    let score = 0;
    
    // 论文计分
    score += innovation.papers.reduce((sum, paper) => {
      if (paper.type === 'SCI' && paper.authorOrder === 1) return sum + 40;
      if (paper.type === 'SCI' && paper.authorOrder === 2) return sum + 20;
      if (paper.type === 'EI' && paper.authorOrder === 1) return sum + 30;
      // ... 其他情况
      return sum;
    }, 0);
    
    // 专利计分
    score += innovation.patents.reduce((sum, patent) => {
      if (patent.type === 'INVENTION' && patent.inventorOrder === 1) return sum + 30;
      // ... 其他情况
      return sum;
    }, 0);
    
    // 竞赛计分
    score += innovation.competitions.reduce((sum, comp) => {
      if (comp.level === 'NATIONAL' && comp.award === 'FIRST') return sum + 40;
      // ... 其他情况
      return sum;
    }, 0);
    
    return Math.min(100, score);
  }
}
```

### 6.4 数据导入导出

#### Excel数据导入
```typescript
import * as XLSX from 'xlsx';

class ExcelImporter {
  async importMentors(file: File): Promise<MentorData[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    return data.map(row => ({
      name: row['姓名'],
      employeeId: row['工号'],
      title: row['职称'],
      department: row['院系'],
      researchAreas: row['研究方向']?.split('、') || [],
      email: row['邮箱'],
      phone: row['电话'],
      maxStudents: parseInt(row['可指导学生数']) || 3,
    }));
  }
  
  async importEvaluationHistory(file: File): Promise<EvaluationData[]> {
    // 导入历史评价数据
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    
    // 处理不同sheet（思想品德、学业成绩、科技创新、科研推进）
    const evaluations = [];
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      // 根据sheet名称判断维度
      if (sheetName.includes('思想品德')) {
        // 处理思想品德数据
      } else if (sheetName.includes('学业成绩')) {
        // 处理学业成绩数据
      }
      // ... 其他维度
    }
    
    return evaluations;
  }
}
```

#### 报表导出
```typescript
class ReportExporter {
  async exportEvaluationReport(
    semester: string,
    format: 'excel' | 'pdf'
  ): Promise<Blob> {
    // 获取评价数据
    const evaluations = await this.getEvaluations(semester);
    
    if (format === 'excel') {
      return this.generateExcel(evaluations);
    } else {
      return this.generatePDF(evaluations);
    }
  }
  
  private generateExcel(data: any[]): Blob {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '综合评价结果');
    
    // 添加其他sheet
    // ... 分维度统计等
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
  
  private async generatePDF(data: any[]): Promise<Blob> {
    // 使用 jsPDF 或其他库生成PDF
    // 包含：封面、统计图表、详细数据、签名页等
  }
}
```

---

## 7. 数据迁移策略

### 7.1 历史数据导入计划

#### 第一批：基础数据（第1周）
1. **用户数据**
   - 从各年级名单导入学生信息
   - 从导师一览表导入导师信息
   - 设置初始密码和权限

2. **课程和培养方案**
   - 导入课程体系
   - 导入培养计划模板

#### 第二批：业务数据（第2周）
1. **导师关系**
   - 导入2021-2023级师生对应关系
   - 导入历史申请记录

2. **项目数据**
   - 导入进行中的创新项目
   - 导入企业项目任务书

#### 第三批：成果和评价（第3周）
1. **成果数据**
   - 导入历史论文、专利、竞赛记录
   - 验证和去重

2. **评价数据**
   - 导入2023-2024学年评价结果
   - 计算历史排名

### 7.2 数据清洗规则

```typescript
class DataCleaner {
  // 学号标准化
  normalizeStudentId(id: string): string {
    // U202210001 -> U202210001
    return id.toUpperCase().trim();
  }
  
  // 姓名处理
  normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, '');
  }
  
  // GPA标准化
  normalizeGPA(gpa: string | number): number {
    if (typeof gpa === 'string') {
      // 处理 "4.5/5.0" 格式
      if (gpa.includes('/')) {
        const [score] = gpa.split('/');
        return parseFloat(score);
      }
      return parseFloat(gpa);
    }
    return gpa;
  }
  
  // 日期标准化
  normalizeDate(date: string | Date): Date {
    if (typeof date === 'string') {
      // 处理各种日期格式
      // "2024年3月15日" -> Date
      // "2024-03-15" -> Date
      // "2024/3/15" -> Date
    }
    return new Date(date);
  }
}
```

---

## 8. 测试与部署

### 8.1 测试策略

#### 单元测试
```typescript
// __tests__/services/evaluation.test.ts
describe('EvaluationCalculator', () => {
  it('should calculate moral score correctly', () => {
    const calculator = new EvaluationCalculator();
    const moralData = {
      base: 60,
      additions: [
        { item: '学生干部', score: 5 },
        { item: '志愿服务', score: 3 },
      ],
      deductions: [],
    };
    
    const score = calculator.calculateMoral(moralData);
    expect(score).toBe(68);
  });
  
  it('should handle score limits', () => {
    const moralData = {
      base: 60,
      additions: [
        { item: '多项荣誉', score: 50 },
      ],
      deductions: [],
    };
    
    const score = calculator.calculateMoral(moralData);
    expect(score).toBe(100); // 不超过100
  });
});
```

#### 集成测试
```typescript
// __tests__/api/mentor.test.ts
describe('Mentor API', () => {
  it('should handle mentor application', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        academicYear: '2024-2025',
        choices: [
          { mentorId: 'mentor1', order: 1, reason: '研究方向匹配' },
          { mentorId: 'mentor2', order: 2, reason: '对项目感兴趣' },
        ],
        personalStatement: '个人陈述',
        researchInterest: '研究兴趣',
      },
    });
    
    await mentorApplyHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('applicationId');
  });
});
```

#### E2E测试
```typescript
// e2e/mentor-application.spec.ts
import { test, expect } from '@playwright/test';

test('complete mentor application flow', async ({ page }) => {
  // 1. 登录
  await page.goto('/login');
  await page.fill('input[name="email"]', 'student@hust.edu.cn');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 2. 进入导师申请页面
  await page.goto('/mentors/apply');
  
  // 3. 选择导师
  await page.click('button:has-text("选择第一志愿")');
  await page.click('text=张三教授');
  
  // 4. 填写申请理由
  await page.fill('textarea[name="firstReason"]', '研究方向与我的兴趣高度匹配');
  
  // 5. 提交申请
  await page.click('button:has-text("提交申请")');
  
  // 6. 验证提交成功
  await expect(page.locator('text=申请提交成功')).toBeVisible();
});
```

### 8.2 部署方案

#### 环境配置
```bash
# .env.production
DATABASE_URL="postgresql://user:password@localhost:5432/hust_research_prod"
NEXTAUTH_URL="https://research.hust.edu.cn"
NEXTAUTH_SECRET="production-secret-key"

# 文件存储
UPLOAD_DIR="/data/uploads"
MAX_FILE_SIZE="52428800" # 50MB

# 邮件服务
SMTP_HOST="smtp.hust.edu.cn"
SMTP_PORT="587"
SMTP_USER="noreply@hust.edu.cn"
SMTP_PASSWORD="smtp-password"

# Redis缓存
REDIS_URL="redis://localhost:6379"

# 日志
LOG_LEVEL="info"
LOG_DIR="/data/logs"
```

#### Docker部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 依赖安装
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 部署流程
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t hust-research:${{ github.sha }} .
      
      - name: Run tests
        run: |
          docker run --rm hust-research:${{ github.sha }} npm test
          docker run --rm hust-research:${{ github.sha }} npm run test:e2e
      
      - name: Push to registry
        run: |
          docker tag hust-research:${{ github.sha }} registry.hust.edu.cn/research:latest
          docker push registry.hust.edu.cn/research:latest
      
      - name: Deploy to server
        run: |
          ssh deploy@research.hust.edu.cn 'docker pull registry.hust.edu.cn/research:latest'
          ssh deploy@research.hust.edu.cn 'docker-compose up -d'
```

### 8.3 监控和维护

#### 监控指标
1. **性能监控**
   - 页面加载时间
   - API响应时间
   - 数据库查询性能

2. **业务监控**
   - 日活跃用户数
   - 功能使用率
   - 错误率

3. **资源监控**
   - CPU使用率
   - 内存使用率
   - 磁盘空间

#### 备份策略
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"

# 备份数据库
pg_dump -U postgres -d hust_research > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# 上传到对象存储
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://hust-research-backup/
```

---

## 9. 总结

### 9.1 项目规模
- **代码行数**: 预计50,000+ 行
- **数据表**: 30+ 个
- **API端点**: 100+ 个
- **页面数量**: 50+ 个
- **开发周期**: 8周

### 9.2 关键成功因素
1. **充分理解业务**: 深入理解高校科研管理流程
2. **数据标准化**: 统一各类Excel数据格式
3. **用户体验**: 简化操作流程，降低学习成本
4. **性能优化**: 确保系统响应速度
5. **安全保障**: 保护敏感数据

### 9.3 风险控制
1. **技术风险**: 选用成熟稳定的技术栈
2. **需求风险**: 分阶段交付，及时获取反馈
3. **数据风险**: 完善的备份和恢复机制
4. **安全风险**: 严格的权限控制和审计

### 9.4 后续规划
1. **移动端开发**: 开发微信小程序
2. **AI功能**: 智能推荐、自动评分
3. **系统集成**: 与学校其他系统对接
4. **功能扩展**: 支持更多院系使用

---

*本指南将随项目进展持续更新，确保开发过程有据可依。*