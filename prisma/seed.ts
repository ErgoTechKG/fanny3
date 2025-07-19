import { PrismaClient, Role, TopicStatus, Difficulty, ApplicationStatus, ProjectStatus, ProgressType, ProgressStatus, AchievementType, TopicType, MentorApplicationStatus, FormCategory, AlertLevel, MilestoneType, MilestoneProgressStatus, MilestoneStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Chinese name generators
const chineseSurnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '胡', '朱', '郭', '何', '林', '罗', '梁']
const chineseGivenNames = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
  '建国', '建华', '文', '平', '辉', '志强', '俊', '鹏', '浩', '宇', '欣', '婷', '萍', '华', '斌', '慧', '燕', '玲', '凯', '峰'
]

const departments = ['机械工程学院', '计算机科学学院', '电子信息学院', '自动化学院', '材料科学学院', '能源与动力学院']
const researchFields = ['人工智能', '机器学习', '物联网', '机器人技术', '新材料', '智能制造', '大数据', '云计算', '区块链', '量子计算']

function generateChineseName(): { name: string; nameEn: string } {
  const surname = chineseSurnames[Math.floor(Math.random() * chineseSurnames.length)]
  const givenName = chineseGivenNames[Math.floor(Math.random() * chineseGivenNames.length)]
  const name = surname + givenName
  
  // Generate English name (pinyin-style)
  const surnameEn = ['Zhang', 'Wang', 'Li', 'Zhao', 'Chen', 'Liu', 'Yang', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Ma', 'Hu', 'Zhu', 'Guo', 'He', 'Lin', 'Luo', 'Liang']
  const givenNameEn = ['Wei', 'Fang', 'Na', 'Xiuying', 'Min', 'Jing', 'Li', 'Qiang', 'Lei', 'Jun', 'Yang', 'Yong', 'Yan', 'Jie', 'Juan', 'Tao', 'Ming', 'Chao', 'Xiulan', 'Xia']
  
  const indexSurname = chineseSurnames.indexOf(surname)
  const indexGiven = chineseGivenNames.indexOf(givenName)
  
  return {
    name,
    nameEn: `${surnameEn[indexSurname] || 'Zhang'} ${givenNameEn[indexGiven] || 'Wei'}`
  }
}

function generateStudentId(year: number, index: number): string {
  return `M${year}${String(index).padStart(6, '0')}`
}

async function main() {
  console.log('🌱 开始生成种子数据...')

  // Clear existing data
  await prisma.$transaction([
    prisma.formSubmission.deleteMany(),
    prisma.formTemplate.deleteMany(),
    prisma.rotationLog.deleteMany(),
    prisma.labRotationApplication.deleteMany(),
    prisma.mentorApplication.deleteMany(),
    prisma.lab.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.progressReport.deleteMany(),
    prisma.milestone.deleteMany(),
    prisma.professorFeedback.deleteMany(),
    prisma.projectMilestone.deleteMany(),
    prisma.researchLog.deleteMany(),
    prisma.progress.deleteMany(),
    prisma.project.deleteMany(),
    prisma.application.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.eventAttendee.deleteMany(),
    prisma.event.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.labRotation.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Admin users
  const admins = []
  for (let i = 1; i <= 2; i++) {
    const { name, nameEn } = generateChineseName()
    const admin = await prisma.user.create({
      data: {
        email: `admin${i}@hust.edu.cn`,
        password: hashedPassword,
        name,
        nameEn,
        phone: `1380000000${i}`,
        department: '教务处',
        roles: {
          create: { role: Role.ADMIN }
        }
      }
    })
    admins.push(admin)
  }
  console.log(`✅ 创建了 ${admins.length} 个管理员账号`)

  // Create Secretary users
  const secretaries = []
  for (let i = 1; i <= 5; i++) {
    const { name, nameEn } = generateChineseName()
    const department = departments[Math.floor(Math.random() * departments.length)]
    const secretary = await prisma.user.create({
      data: {
        email: `secretary${i}@hust.edu.cn`,
        password: hashedPassword,
        name,
        nameEn,
        phone: `1381111000${i}`,
        department,
        roles: {
          create: { role: Role.SECRETARY }
        }
      }
    })
    secretaries.push(secretary)
  }
  console.log(`✅ 创建了 ${secretaries.length} 个科研秘书账号`)

  // Create Professor users
  const professors = []
  for (let i = 1; i <= 20; i++) {
    const { name, nameEn } = generateChineseName()
    const department = departments[Math.floor(Math.random() * departments.length)]
    const professor = await prisma.user.create({
      data: {
        email: `professor${i}@hust.edu.cn`,
        password: hashedPassword,
        name,
        nameEn,
        phone: `1382222${String(i).padStart(4, '0')}`,
        department,
        maxStudents: Math.floor(Math.random() * 3) + 2, // 2-4 students per professor
        roles: {
          create: { role: Role.PROFESSOR }
        }
      }
    })
    professors.push(professor)
  }
  console.log(`✅ 创建了 ${professors.length} 个导师账号`)

  // Create Student users
  const students = []
  const currentYear = new Date().getFullYear()
  for (let i = 1; i <= 100; i++) {
    const { name, nameEn } = generateChineseName()
    const year = currentYear - Math.floor(Math.random() * 4) // Students from last 4 years
    const department = departments[Math.floor(Math.random() * departments.length)]
    const student = await prisma.user.create({
      data: {
        email: `student${i}@hust.edu.cn`,
        password: hashedPassword,
        name,
        nameEn,
        studentId: generateStudentId(year, i),
        phone: `1383333${String(i).padStart(4, '0')}`,
        department,
        roles: {
          create: { role: Role.STUDENT }
        }
      }
    })
    students.push(student)
  }
  console.log(`✅ 创建了 ${students.length} 个学生账号`)

  // Create Topics
  const topicTemplates = [
    { title: '基于深度学习的图像识别算法研究', titleEn: 'Research on Deep Learning-based Image Recognition Algorithms', field: '人工智能', difficulty: Difficulty.ADVANCED, type: TopicType.INNOVATION },
    { title: '物联网智能家居控制系统设计与实现', titleEn: 'Design and Implementation of IoT Smart Home Control System', field: '物联网', difficulty: Difficulty.INTERMEDIATE, type: TopicType.INNOVATION },
    { title: '机器人视觉导航技术研究', titleEn: 'Research on Robot Visual Navigation Technology', field: '机器人技术', difficulty: Difficulty.ADVANCED, type: TopicType.INNOVATION },
    { title: '新型纳米材料的制备与表征', titleEn: 'Preparation and Characterization of Novel Nanomaterials', field: '新材料', difficulty: Difficulty.ADVANCED, type: TopicType.INNOVATION },
    { title: '智能制造系统的优化与调度', titleEn: 'Optimization and Scheduling of Intelligent Manufacturing Systems', field: '智能制造', difficulty: Difficulty.INTERMEDIATE, type: TopicType.ENTERPRISE },
    { title: '大数据分析平台的设计与开发', titleEn: 'Design and Development of Big Data Analytics Platform', field: '大数据', difficulty: Difficulty.INTERMEDIATE, type: TopicType.ENTERPRISE },
    { title: '云计算环境下的资源调度算法', titleEn: 'Resource Scheduling Algorithms in Cloud Computing Environment', field: '云计算', difficulty: Difficulty.ADVANCED, type: TopicType.INNOVATION },
    { title: '区块链技术在供应链管理中的应用', titleEn: 'Application of Blockchain Technology in Supply Chain Management', field: '区块链', difficulty: Difficulty.INTERMEDIATE, type: TopicType.ENTERPRISE },
    { title: '量子计算算法的研究与实现', titleEn: 'Research and Implementation of Quantum Computing Algorithms', field: '量子计算', difficulty: Difficulty.ADVANCED, type: TopicType.INNOVATION },
    { title: '机器学习在医疗诊断中的应用', titleEn: 'Application of Machine Learning in Medical Diagnosis', field: '机器学习', difficulty: Difficulty.INTERMEDIATE, type: TopicType.INNOVATION },
  ]

  const topics = []
  for (let i = 0; i < 50; i++) {
    const template = topicTemplates[i % topicTemplates.length]
    const professor = professors[Math.floor(Math.random() * professors.length)]
    const status = [TopicStatus.RECRUITING, TopicStatus.IN_PROGRESS, TopicStatus.COMPLETED][Math.floor(Math.random() * 3)]
    
    const topic = await prisma.topic.create({
      data: {
        title: `${template.title} - 第${i + 1}期`,
        titleEn: `${template.titleEn} - Phase ${i + 1}`,
        description: `本课题旨在研究${template.title}的相关理论和技术，探索其在实际应用中的可能性。研究内容包括文献调研、理论分析、实验设计、系统实现等多个方面。`,
        descriptionEn: `This research aims to study the theories and technologies related to ${template.titleEn}, exploring their possibilities in practical applications.`,
        professorId: professor.id,
        status,
        maxStudents: Math.floor(Math.random() * 3) + 1,
        currentStudents: status === TopicStatus.RECRUITING ? 0 : Math.floor(Math.random() * 3),
        prerequisites: ['扎实的编程基础', '良好的数学功底', '较强的学习能力'],
        expectedOutcomes: ['完成系统原型', '撰写研究论文', '申请相关专利'],
        field: template.field,
        difficulty: template.difficulty,
        type: i % 3 === 0 ? TopicType.ENTERPRISE : TopicType.INNOVATION,
        companyName: i % 3 === 0 ? '华为技术有限公司' : null,
        companyMentor: i % 3 === 0 ? '张工程师' : null,
      }
    })
    topics.push(topic)
  }
  console.log(`✅ 创建了 ${topics.length} 个研究课题`)

  // Create Applications
  const applications = []
  for (let i = 0; i < 150; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    const topic = topics.filter(t => t.status === TopicStatus.RECRUITING)[Math.floor(Math.random() * topics.filter(t => t.status === TopicStatus.RECRUITING).length)]
    
    if (!topic) continue

    try {
      const application = await prisma.application.create({
        data: {
          studentId: student.id,
          topicId: topic.id,
          resume: `姓名：${student.name}\n学号：${student.studentId || 'N/A'}\n专业：计算机科学与技术\n\n教育背景：\n- 华中科技大学 本科在读\n- GPA: ${(3.5 + Math.random() * 0.5).toFixed(2)}/4.0\n\n技能特长：\n- 编程语言：Python, Java, C++\n- 熟悉机器学习框架\n- 良好的英语读写能力`,
          statement: `我对${topic.title}这个课题非常感兴趣。通过前期的学习，我已经掌握了相关的基础知识，并且在相关领域有一定的实践经验。我相信通过参与这个课题，能够进一步提升自己的研究能力。`,
          status: [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED][Math.floor(Math.random() * 3)],
          reviewNotes: Math.random() > 0.5 ? '学生基础扎实，有较强的研究潜力。' : null,
        }
      })
      applications.push(application)
    } catch (e) {
      // Skip if duplicate
    }
  }
  console.log(`✅ 创建了 ${applications.length} 个课题申请`)

  // Create Projects (from accepted applications)
  const projects = []
  const acceptedApplications = await prisma.application.findMany({
    where: { status: ApplicationStatus.ACCEPTED },
    include: { topic: true }
  })

  for (const app of acceptedApplications) {
    const project = await prisma.project.create({
      data: {
        studentId: app.studentId,
        advisorId: app.topic.professorId,
        topicId: app.topicId,
        status: ProjectStatus.ACTIVE,
        startDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random start within last 90 days
      }
    })
    projects.push(project)

    // Create milestones for each project
    const milestones = [
      { name: '文献调研', days: 30 },
      { name: '开题报告', days: 45 },
      { name: '实验设计', days: 60 },
      { name: '中期检查', days: 90 },
      { name: '论文撰写', days: 120 },
      { name: '结题答辩', days: 150 },
    ]

    for (const milestone of milestones) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          name: milestone.name,
          description: `完成${milestone.name}相关工作`,
          plannedDate: new Date(project.startDate.getTime() + milestone.days * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.5 && milestone.days < 90 ? MilestoneStatus.COMPLETED : MilestoneStatus.IN_PROGRESS,
          actualDate: Math.random() > 0.5 && milestone.days < 90 ? new Date() : null,
          progress: Math.random() > 0.5 && milestone.days < 90 ? 100 : Math.floor(Math.random() * 80),
          order: milestones.indexOf(milestone),
        }
      })
    }
  }
  console.log(`✅ 创建了 ${projects.length} 个研究项目`)

  // Create Progress records
  let progressCount = 0
  for (const project of projects) {
    const numProgress = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < numProgress; i++) {
      const type = [ProgressType.WEEKLY_SUMMARY, ProgressType.MONTHLY_REPORT, ProgressType.MILESTONE][Math.floor(Math.random() * 3)]
      await prisma.progress.create({
        data: {
          projectId: project.id,
          studentId: project.studentId,
          type,
          title: `${type === ProgressType.WEEKLY_SUMMARY ? '周' : type === ProgressType.MONTHLY_REPORT ? '月' : '里程碑'}进展报告 - ${i + 1}`,
          content: `本${type === ProgressType.WEEKLY_SUMMARY ? '周' : '月'}主要完成了以下工作：\n1. 阅读相关文献5篇\n2. 完成实验数据收集\n3. 编写代码模块\n\n下一步计划：\n1. 数据分析与处理\n2. 算法优化\n3. 撰写论文初稿`,
          attachments: [],
          status: [ProgressStatus.SUBMITTED, ProgressStatus.REVIEWED, ProgressStatus.APPROVED][Math.floor(Math.random() * 3)],
          feedback: Math.random() > 0.5 ? '进展良好，请继续保持。注意加强理论分析部分。' : null,
        }
      })
      progressCount++
    }
  }
  console.log(`✅ 创建了 ${progressCount} 条进展记录`)

  // Create Achievements
  let achievementCount = 0
  const achievementTypes = [
    { type: AchievementType.PAPER, title: '发表SCI论文', description: '在国际期刊发表研究论文' },
    { type: AchievementType.PATENT, title: '申请发明专利', description: '申请国家发明专利' },
    { type: AchievementType.SOFTWARE_COPYRIGHT, title: '软件著作权', description: '获得软件著作权登记' },
    { type: AchievementType.COMPETITION, title: '竞赛获奖', description: '参加学科竞赛获奖' },
  ]

  for (const student of students.slice(0, 50)) { // Top 50 students have achievements
    const numAchievements = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < numAchievements; i++) {
      const achievement = achievementTypes[Math.floor(Math.random() * achievementTypes.length)]
      await prisma.achievement.create({
        data: {
          studentId: student.id,
          type: achievement.type,
          title: `${achievement.title} - ${student.name}`,
          description: achievement.description,
          verified: Math.random() > 0.3,
          verifiedBy: Math.random() > 0.3 ? professors[0].id : null,
          verifiedAt: Math.random() > 0.3 ? new Date() : null,
          score: achievement.type === AchievementType.COMPETITION ? Math.floor(Math.random() * 100) : null,
        }
      })
      achievementCount++
    }
  }
  console.log(`✅ 创建了 ${achievementCount} 个成果记录`)

  // Create Evaluations
  let evaluationCount = 0
  for (const student of students.slice(0, 30)) { // Top 30 students have evaluations
    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: student.id,
        year: currentYear,
        semester: 1,
        moralScore: 80 + Math.random() * 20,
        academicScore: 75 + Math.random() * 25,
        innovationScore: 70 + Math.random() * 30,
        researchScore: 70 + Math.random() * 30,
        totalScore: 75 + Math.random() * 25,
        rank: ['A', 'B', 'B', 'C'][Math.floor(Math.random() * 4)],
        comments: '该学生表现优秀，学习认真，研究能力强。',
      }
    })
    evaluationCount++
  }
  console.log(`✅ 创建了 ${evaluationCount} 条综合评价记录`)

  // Create Labs
  const labs = []
    const labData = [
    { name: '智能机器人实验室', nameEn: 'Intelligent Robotics Lab', code: 'IRL', researchAreas: ['机器人控制', '计算机视觉', '人机交互'] },
    { name: '人工智能与机器学习实验室', nameEn: 'AI and Machine Learning Lab', code: 'AIML', researchAreas: ['深度学习', '自然语言处理', '计算机视觉'] },
    { name: '物联网技术实验室', nameEn: 'IoT Technology Lab', code: 'IoT', researchAreas: ['传感器网络', '边缘计算', '智能家居'] },
    { name: '智能制造实验室', nameEn: 'Smart Manufacturing Lab', code: 'SM', researchAreas: ['数字孪生', '工业4.0', '智能优化'] },
    { name: '新材料研究实验室', nameEn: 'Advanced Materials Lab', code: 'AML', researchAreas: ['纳米材料', '复合材料', '功能材料'] },
  ]

  for (const labInfo of labData) {
    const director = professors[Math.floor(Math.random() * professors.length)]
    const lab = await prisma.lab.create({
      data: {
        name: labInfo.name,
        nameEn: labInfo.nameEn,
        code: labInfo.code,
        directorId: director.id,
        location: `科技楼${Math.floor(Math.random() * 5) + 1}楼${Math.floor(Math.random() * 20) + 101}室`,
        capacity: Math.floor(Math.random() * 10) + 5,
        description: `${labInfo.name}是我校重点建设的科研平台，致力于${labInfo.researchAreas.join('、')}等领域的前沿研究。`,
        researchAreas: labInfo.researchAreas,
        equipment: ['高性能计算集群', '3D打印机', '精密测量仪器', '实验平台'],
        achievements: ['国家级科研项目5项', 'SCI论文30余篇', '发明专利10项'],
      }
    })
    labs.push(lab)
  }
  console.log(`✅ 创建了 ${labs.length} 个实验室`)

  // Create Mentor Applications for current academic year
  const mentorApplications = []
  const currentAcademicYear = `${currentYear}-${currentYear + 1}`
  
  // Select 30 students to create mentor applications
  for (const student of students.slice(0, 30)) {
    const shuffledProfessors = [...professors].sort(() => 0.5 - Math.random())
    const firstChoice = shuffledProfessors[0]
    const secondChoice = shuffledProfessors[1]
    const thirdChoice = shuffledProfessors[2]
    
    const application = await prisma.mentorApplication.create({
      data: {
        studentId: student.id,
        academicYear: currentAcademicYear,
        firstChoiceId: firstChoice.id,
        firstReason: `我对${firstChoice.name}教授的研究方向非常感兴趣，希望能在其指导下开展科研工作。`,
        secondChoiceId: secondChoice.id,
        secondReason: `${secondChoice.name}教授在相关领域有深厚的学术造诣，我希望能向其学习。`,
        thirdChoiceId: thirdChoice.id,
        thirdReason: `${thirdChoice.name}教授的研究方向与我的兴趣相符。`,
        personalStatement: '本人学习成绩优秀，对科研充满热情，具有较强的学习能力和创新意识。',
        researchInterest: '人工智能、机器学习、深度学习',
        status: MentorApplicationStatus.PENDING,
      }
    })
    mentorApplications.push(application)
  }
  console.log(`✅ 创建了 ${mentorApplications.length} 个导师申请`)

  // Create Form Templates
  const formTemplates = [
    {
      name: '导师信息表',
      code: 'MENTOR_INFO',
      category: FormCategory.MENTOR_INFO,
      schema: {
        fields: [
          { name: 'name', type: 'text', label: '姓名', required: true },
          { name: 'employeeId', type: 'text', label: '工号', required: true },
          { name: 'title', type: 'select', label: '职称', required: true, options: ['教授', '副教授', '讲师'] },
          { name: 'department', type: 'text', label: '院系', required: true },
          { name: 'researchAreas', type: 'array', label: '研究方向', required: true },
          { name: 'maxStudents', type: 'number', label: '可指导学生数', required: true },
        ]
      }
    },
    {
      name: '学生选择导师意向书',
      code: 'MENTOR_APPLICATION',
      category: FormCategory.MENTOR_APPLICATION,
      schema: {
        fields: [
          { name: 'firstChoice', type: 'select', label: '第一志愿导师', required: true },
          { name: 'firstReason', type: 'textarea', label: '选择理由', required: true },
          { name: 'secondChoice', type: 'select', label: '第二志愿导师', required: true },
          { name: 'secondReason', type: 'textarea', label: '选择理由', required: true },
          { name: 'thirdChoice', type: 'select', label: '第三志愿导师', required: false },
          { name: 'thirdReason', type: 'textarea', label: '选择理由', required: false },
        ]
      }
    },
    {
      name: '实验室轮转申请表',
      code: 'LAB_ROTATION',
      category: FormCategory.LAB_ROTATION,
      schema: {
        fields: [
          { name: 'semester', type: 'text', label: '学期', required: true },
          { name: 'firstLab', type: 'select', label: '第一志愿实验室', required: true },
          { name: 'secondLab', type: 'select', label: '第二志愿实验室', required: true },
          { name: 'thirdLab', type: 'select', label: '第三志愿实验室', required: false },
          { name: 'reason', type: 'textarea', label: '申请理由', required: true },
        ]
      }
    },
  ]

  for (const template of formTemplates) {
    await prisma.formTemplate.create({
      data: {
        name: template.name,
        code: template.code,
        category: template.category,
        schema: template.schema,
        active: true,
        version: 1,
      }
    })
  }
  console.log(`✅ 创建了 ${formTemplates.length} 个表单模板`)

  // Create Project Milestones with alerts
  let projectMilestoneCount = 0
  for (const project of projects.slice(0, 10)) { // Add milestones for first 10 projects
    const milestoneTypes = [
      { type: MilestoneType.LITERATURE_REVIEW, name: '文献调研', days: 30 },
      { type: MilestoneType.PROPOSAL, name: '开题报告', days: 45 },
      { type: MilestoneType.EXPERIMENT_DESIGN, name: '实验设计', days: 60 },
      { type: MilestoneType.DATA_COLLECTION, name: '数据收集', days: 90 },
      { type: MilestoneType.PHASE_SUMMARY, name: '阶段总结', days: 120 },
      { type: MilestoneType.RESULT_OUTPUT, name: '成果产出', days: 150 },
    ]

    for (const milestone of milestoneTypes) {
      const dueDate = new Date(project.startDate.getTime() + milestone.days * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      let status = MilestoneProgressStatus.PENDING
      let alertLevel = AlertLevel.GREEN
      
      if (daysUntilDue < 0) {
        status = MilestoneProgressStatus.DELAYED
        alertLevel = AlertLevel.RED
      } else if (daysUntilDue < 7) {
        status = MilestoneProgressStatus.AT_RISK
        alertLevel = AlertLevel.YELLOW
      } else if (Math.random() > 0.7) {
        status = MilestoneProgressStatus.COMPLETED
      }

      await prisma.projectMilestone.create({
        data: {
          projectId: project.id,
          name: milestone.name,
          nameEn: milestone.type,
          type: milestone.type,
          status,
          alertLevel,
          dueDate,
          completedAt: status === MilestoneProgressStatus.COMPLETED ? new Date() : null,
        }
      })
      projectMilestoneCount++
    }
  }
  console.log(`✅ 创建了 ${projectMilestoneCount} 个项目里程碑`)

  console.log('\n✨ 种子数据生成完成！')
  console.log('\n📧 测试账号（密码均为 password123）:')
  console.log('  管理员: admin1@hust.edu.cn')
  console.log('  科研秘书: secretary1@hust.edu.cn')
  console.log('  导师: professor1@hust.edu.cn')
  console.log('  学生: student1@hust.edu.cn')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })