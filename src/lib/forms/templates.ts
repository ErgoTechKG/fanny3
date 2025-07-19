import type { FormSchema } from '@/lib/services/form-engine'

/**
 * 8 form templates based on 附件2：需要自动化的表格梳理
 */

// 1. 科研秘书-学生科技创新申报统计表
export const innovationDeclarationForm: FormSchema = {
  id: 'innovation-declaration-stats',
  type: 'INNOVATION_DECLARATION',
  version: 1,
  title: '学生科技创新申报统计表',
  titleEn: 'Student Innovation Declaration Statistics',
  description: '用于统计学生参与的各类科技创新项目申报情况',
  sections: [
    {
      id: 'basic-info',
      title: '基本信息',
      titleEn: 'Basic Information',
      order: 0,
      fields: [
        {
          id: 'academicYear',
          type: 'text',
          label: '学年',
          labelEn: 'Academic Year',
          required: true,
          placeholder: '2024-2025',
          validation: {
            pattern: '^\\d{4}-\\d{4}$'
          }
        },
        {
          id: 'department',
          type: 'select',
          label: '院系',
          labelEn: 'Department',
          required: true,
          validation: {
            options: [
              { value: 'CS', label: '计算机科学与技术学院', labelEn: 'School of Computer Science' },
              { value: 'EE', label: '电子信息与通信学院', labelEn: 'School of Electronic Information' },
              { value: 'ME', label: '机械科学与工程学院', labelEn: 'School of Mechanical Engineering' }
            ]
          }
        }
      ]
    },
    {
      id: 'projects',
      title: '项目申报情况',
      titleEn: 'Project Declaration',
      order: 1,
      fields: [
        {
          id: 'projectList',
          type: 'array',
          label: '申报项目列表',
          labelEn: 'Project List',
          required: true,
          arrayFields: [
            {
              id: 'studentName',
              type: 'text',
              label: '学生姓名',
              labelEn: 'Student Name',
              required: true
            },
            {
              id: 'studentId',
              type: 'text',
              label: '学号',
              labelEn: 'Student ID',
              required: true
            },
            {
              id: 'projectName',
              type: 'text',
              label: '项目名称',
              labelEn: 'Project Name',
              required: true
            },
            {
              id: 'projectType',
              type: 'select',
              label: '项目类型',
              labelEn: 'Project Type',
              required: true,
              validation: {
                options: [
                  { value: 'NATIONAL', label: '国家级', labelEn: 'National' },
                  { value: 'PROVINCIAL', label: '省部级', labelEn: 'Provincial' },
                  { value: 'SCHOOL', label: '校级', labelEn: 'School' }
                ]
              }
            },
            {
              id: 'advisorName',
              type: 'text',
              label: '指导教师',
              labelEn: 'Advisor',
              required: true
            },
            {
              id: 'applicationDate',
              type: 'date',
              label: '申报日期',
              labelEn: 'Application Date',
              required: true
            },
            {
              id: 'status',
              type: 'select',
              label: '申报状态',
              labelEn: 'Status',
              required: true,
              validation: {
                options: [
                  { value: 'PENDING', label: '待审核', labelEn: 'Pending' },
                  { value: 'APPROVED', label: '已立项', labelEn: 'Approved' },
                  { value: 'REJECTED', label: '未通过', labelEn: 'Rejected' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'summary',
      title: '统计汇总',
      titleEn: 'Summary Statistics',
      order: 2,
      fields: [
        {
          id: 'totalProjects',
          type: 'number',
          label: '申报总数',
          labelEn: 'Total Projects',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'approvedProjects',
          type: 'number',
          label: '立项数量',
          labelEn: 'Approved Projects',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'submitter',
          type: 'text',
          label: '填表人',
          labelEn: 'Submitter',
          required: true
        },
        {
          id: 'submitDate',
          type: 'date',
          label: '填表日期',
          labelEn: 'Submit Date',
          required: true,
          defaultValue: new Date().toISOString().split('T')[0]
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['ADMIN', 'SECRETARY']
  }
}

// 2. 科研秘书-学生科研中检自查汇总表
export const midtermCheckForm: FormSchema = {
  id: 'midterm-check-summary',
  type: 'MIDTERM_CHECK',
  version: 1,
  title: '学生科研中检自查汇总表',
  titleEn: 'Student Research Midterm Self-Check Summary',
  description: '用于汇总学生科研项目中期检查的自查情况',
  sections: [
    {
      id: 'check-info',
      title: '检查信息',
      titleEn: 'Check Information',
      order: 0,
      fields: [
        {
          id: 'checkPeriod',
          type: 'text',
          label: '检查期间',
          labelEn: 'Check Period',
          required: true,
          placeholder: '2024年春季学期'
        },
        {
          id: 'checkDate',
          type: 'date',
          label: '检查日期',
          labelEn: 'Check Date',
          required: true
        }
      ]
    },
    {
      id: 'project-checks',
      title: '项目检查情况',
      titleEn: 'Project Check Status',
      order: 1,
      fields: [
        {
          id: 'projectChecks',
          type: 'array',
          label: '项目检查列表',
          labelEn: 'Project Check List',
          required: true,
          arrayFields: [
            {
              id: 'projectCode',
              type: 'text',
              label: '项目编号',
              labelEn: 'Project Code',
              required: true
            },
            {
              id: 'projectName',
              type: 'text',
              label: '项目名称',
              labelEn: 'Project Name',
              required: true
            },
            {
              id: 'studentName',
              type: 'text',
              label: '负责学生',
              labelEn: 'Student Leader',
              required: true
            },
            {
              id: 'progressPercentage',
              type: 'number',
              label: '进度完成率(%)',
              labelEn: 'Progress Rate(%)',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'milestoneStatus',
              type: 'select',
              label: '里程碑状态',
              labelEn: 'Milestone Status',
              required: true,
              validation: {
                options: [
                  { value: 'ON_TRACK', label: '正常', labelEn: 'On Track' },
                  { value: 'AT_RISK', label: '有风险', labelEn: 'At Risk' },
                  { value: 'DELAYED', label: '延期', labelEn: 'Delayed' }
                ]
              }
            },
            {
              id: 'selfCheckScore',
              type: 'number',
              label: '自查评分',
              labelEn: 'Self-Check Score',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'issues',
              type: 'textarea',
              label: '存在问题',
              labelEn: 'Issues',
              required: false,
              validation: {
                maxLength: 500
              }
            },
            {
              id: 'improvements',
              type: 'textarea',
              label: '改进措施',
              labelEn: 'Improvements',
              required: false,
              validation: {
                maxLength: 500
              }
            }
          ]
        }
      ]
    },
    {
      id: 'overall-summary',
      title: '总体情况',
      titleEn: 'Overall Summary',
      order: 2,
      fields: [
        {
          id: 'totalChecked',
          type: 'number',
          label: '检查项目总数',
          labelEn: 'Total Projects Checked',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'onTrackCount',
          type: 'number',
          label: '正常进行数',
          labelEn: 'On Track Count',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'atRiskCount',
          type: 'number',
          label: '存在风险数',
          labelEn: 'At Risk Count',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'delayedCount',
          type: 'number',
          label: '延期项目数',
          labelEn: 'Delayed Count',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          id: 'overallAssessment',
          type: 'textarea',
          label: '总体评估',
          labelEn: 'Overall Assessment',
          required: true,
          validation: {
            minLength: 50,
            maxLength: 1000
          }
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['PROFESSOR', 'SECRETARY']
  }
}

// 3. 导师-日常指导情况总结表
export const dailyGuidanceSummaryForm: FormSchema = {
  id: 'daily-guidance-summary',
  type: 'DAILY_GUIDANCE',
  version: 1,
  title: '日常指导情况总结表',
  titleEn: 'Daily Guidance Summary',
  description: '导师记录对学生的日常指导情况',
  sections: [
    {
      id: 'period-info',
      title: '周期信息',
      titleEn: 'Period Information',
      order: 0,
      fields: [
        {
          id: 'academicTerm',
          type: 'text',
          label: '学期',
          labelEn: 'Academic Term',
          required: true,
          placeholder: '2024年春季学期'
        },
        {
          id: 'summaryPeriod',
          type: 'select',
          label: '总结周期',
          labelEn: 'Summary Period',
          required: true,
          validation: {
            options: [
              { value: 'WEEKLY', label: '周总结', labelEn: 'Weekly' },
              { value: 'MONTHLY', label: '月总结', labelEn: 'Monthly' },
              { value: 'QUARTERLY', label: '季度总结', labelEn: 'Quarterly' }
            ]
          }
        },
        {
          id: 'startDate',
          type: 'date',
          label: '开始日期',
          labelEn: 'Start Date',
          required: true
        },
        {
          id: 'endDate',
          type: 'date',
          label: '结束日期',
          labelEn: 'End Date',
          required: true
        }
      ]
    },
    {
      id: 'guidance-records',
      title: '指导记录',
      titleEn: 'Guidance Records',
      order: 1,
      fields: [
        {
          id: 'studentGuidance',
          type: 'array',
          label: '学生指导情况',
          labelEn: 'Student Guidance',
          required: true,
          arrayFields: [
            {
              id: 'studentName',
              type: 'text',
              label: '学生姓名',
              labelEn: 'Student Name',
              required: true
            },
            {
              id: 'projectTitle',
              type: 'text',
              label: '项目名称',
              labelEn: 'Project Title',
              required: true
            },
            {
              id: 'meetingCount',
              type: 'number',
              label: '指导次数',
              labelEn: 'Meeting Count',
              required: true,
              validation: {
                min: 0
              }
            },
            {
              id: 'totalHours',
              type: 'number',
              label: '指导时长(小时)',
              labelEn: 'Total Hours',
              required: true,
              validation: {
                min: 0
              }
            },
            {
              id: 'guidanceType',
              type: 'checkbox',
              label: '指导方式',
              labelEn: 'Guidance Type',
              required: true,
              validation: {
                options: [
                  { value: 'FACE_TO_FACE', label: '面对面', labelEn: 'Face to Face' },
                  { value: 'ONLINE', label: '线上', labelEn: 'Online' },
                  { value: 'EMAIL', label: '邮件', labelEn: 'Email' },
                  { value: 'WECHAT', label: '微信', labelEn: 'WeChat' }
                ]
              }
            },
            {
              id: 'mainContent',
              type: 'textarea',
              label: '主要指导内容',
              labelEn: 'Main Content',
              required: true,
              validation: {
                minLength: 50,
                maxLength: 500
              }
            },
            {
              id: 'studentProgress',
              type: 'select',
              label: '学生进展',
              labelEn: 'Student Progress',
              required: true,
              validation: {
                options: [
                  { value: 'EXCELLENT', label: '优秀', labelEn: 'Excellent' },
                  { value: 'GOOD', label: '良好', labelEn: 'Good' },
                  { value: 'AVERAGE', label: '一般', labelEn: 'Average' },
                  { value: 'NEEDS_IMPROVEMENT', label: '需改进', labelEn: 'Needs Improvement' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'summary',
      title: '总结与建议',
      titleEn: 'Summary and Suggestions',
      order: 2,
      fields: [
        {
          id: 'overallSummary',
          type: 'textarea',
          label: '整体指导情况总结',
          labelEn: 'Overall Guidance Summary',
          required: true,
          validation: {
            minLength: 100,
            maxLength: 1000
          }
        },
        {
          id: 'challengesEncountered',
          type: 'textarea',
          label: '遇到的主要问题',
          labelEn: 'Main Challenges',
          required: false,
          validation: {
            maxLength: 500
          }
        },
        {
          id: 'improvementSuggestions',
          type: 'textarea',
          label: '改进建议',
          labelEn: 'Improvement Suggestions',
          required: false,
          validation: {
            maxLength: 500
          }
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: false
  }
}

// 4. 学生-实验室轮转考核表
export const labRotationAssessmentForm: FormSchema = {
  id: 'lab-rotation-assessment',
  type: 'LAB_ROTATION_ASSESSMENT',
  version: 1,
  title: '实验室轮转考核表',
  titleEn: 'Lab Rotation Assessment Form',
  description: '用于评估学生在实验室轮转期间的表现',
  sections: [
    {
      id: 'rotation-info',
      title: '轮转信息',
      titleEn: 'Rotation Information',
      order: 0,
      fields: [
        {
          id: 'studentName',
          type: 'text',
          label: '学生姓名',
          labelEn: 'Student Name',
          required: true
        },
        {
          id: 'studentId',
          type: 'text',
          label: '学号',
          labelEn: 'Student ID',
          required: true
        },
        {
          id: 'labName',
          type: 'text',
          label: '实验室名称',
          labelEn: 'Lab Name',
          required: true
        },
        {
          id: 'rotationPeriod',
          type: 'text',
          label: '轮转周期',
          labelEn: 'Rotation Period',
          required: true,
          placeholder: '第1-4周'
        },
        {
          id: 'mentor',
          type: 'text',
          label: '指导老师',
          labelEn: 'Mentor',
          required: true
        }
      ]
    },
    {
      id: 'performance-evaluation',
      title: '表现评价',
      titleEn: 'Performance Evaluation',
      order: 1,
      fields: [
        {
          id: 'attendance',
          type: 'number',
          label: '出勤率(%)',
          labelEn: 'Attendance Rate(%)',
          required: true,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          id: 'experimentSkills',
          type: 'number',
          label: '实验技能(20分)',
          labelEn: 'Experimental Skills(20)',
          required: true,
          validation: {
            min: 0,
            max: 20
          }
        },
        {
          id: 'dataAnalysis',
          type: 'number',
          label: '数据分析能力(20分)',
          labelEn: 'Data Analysis(20)',
          required: true,
          validation: {
            min: 0,
            max: 20
          }
        },
        {
          id: 'teamwork',
          type: 'number',
          label: '团队协作(15分)',
          labelEn: 'Teamwork(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        },
        {
          id: 'communication',
          type: 'number',
          label: '沟通表达(15分)',
          labelEn: 'Communication(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        },
        {
          id: 'initiative',
          type: 'number',
          label: '主动性与创新(15分)',
          labelEn: 'Initiative & Innovation(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        },
        {
          id: 'reportQuality',
          type: 'number',
          label: '报告质量(15分)',
          labelEn: 'Report Quality(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        }
      ]
    },
    {
      id: 'achievements',
      title: '主要成果',
      titleEn: 'Main Achievements',
      order: 2,
      fields: [
        {
          id: 'experimentsCompleted',
          type: 'textarea',
          label: '完成的主要实验',
          labelEn: 'Completed Experiments',
          required: true,
          validation: {
            minLength: 50
          }
        },
        {
          id: 'skillsAcquired',
          type: 'textarea',
          label: '掌握的技能',
          labelEn: 'Skills Acquired',
          required: true,
          validation: {
            minLength: 30
          }
        },
        {
          id: 'researchContributions',
          type: 'textarea',
          label: '研究贡献',
          labelEn: 'Research Contributions',
          required: false
        }
      ]
    },
    {
      id: 'final-assessment',
      title: '最终评定',
      titleEn: 'Final Assessment',
      order: 3,
      fields: [
        {
          id: 'totalScore',
          type: 'number',
          label: '总分',
          labelEn: 'Total Score',
          required: true,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          id: 'grade',
          type: 'select',
          label: '等级',
          labelEn: 'Grade',
          required: true,
          validation: {
            options: [
              { value: 'A', label: '优秀(90-100)', labelEn: 'Excellent(90-100)' },
              { value: 'B', label: '良好(80-89)', labelEn: 'Good(80-89)' },
              { value: 'C', label: '合格(60-79)', labelEn: 'Pass(60-79)' },
              { value: 'D', label: '不合格(<60)', labelEn: 'Fail(<60)' }
            ]
          }
        },
        {
          id: 'mentorComments',
          type: 'textarea',
          label: '导师评语',
          labelEn: 'Mentor Comments',
          required: true,
          validation: {
            minLength: 50,
            maxLength: 500
          }
        },
        {
          id: 'continuationRecommendation',
          type: 'radio',
          label: '是否推荐继续在本实验室',
          labelEn: 'Recommend Continuation',
          required: true,
          validation: {
            options: [
              { value: 'YES', label: '是', labelEn: 'Yes' },
              { value: 'NO', label: '否', labelEn: 'No' },
              { value: 'CONDITIONAL', label: '有条件推荐', labelEn: 'Conditional' }
            ]
          }
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['PROFESSOR']
  }
}

// 5. 学生-学期科研进展汇报表
export const semesterProgressReportForm: FormSchema = {
  id: 'semester-progress-report',
  type: 'SEMESTER_PROGRESS',
  version: 1,
  title: '学期科研进展汇报表',
  titleEn: 'Semester Research Progress Report',
  description: '学生汇报本学期科研项目进展情况',
  sections: [
    {
      id: 'basic-info',
      title: '基本信息',
      titleEn: 'Basic Information',
      order: 0,
      fields: [
        {
          id: 'semester',
          type: 'text',
          label: '学期',
          labelEn: 'Semester',
          required: true,
          placeholder: '2024年春季学期'
        },
        {
          id: 'projectTitle',
          type: 'text',
          label: '项目名称',
          labelEn: 'Project Title',
          required: true
        },
        {
          id: 'projectType',
          type: 'select',
          label: '项目类型',
          labelEn: 'Project Type',
          required: true,
          validation: {
            options: [
              { value: 'INNOVATION', label: '创新项目', labelEn: 'Innovation Project' },
              { value: 'ENTERPRISE', label: '企业项目', labelEn: 'Enterprise Project' }
            ]
          }
        },
        {
          id: 'advisor',
          type: 'text',
          label: '指导教师',
          labelEn: 'Advisor',
          required: true
        }
      ]
    },
    {
      id: 'progress-details',
      title: '进展详情',
      titleEn: 'Progress Details',
      order: 1,
      fields: [
        {
          id: 'plannedTasks',
          type: 'textarea',
          label: '本学期计划任务',
          labelEn: 'Planned Tasks',
          required: true,
          validation: {
            minLength: 100
          }
        },
        {
          id: 'completedTasks',
          type: 'textarea',
          label: '已完成任务',
          labelEn: 'Completed Tasks',
          required: true,
          validation: {
            minLength: 100
          }
        },
        {
          id: 'completionRate',
          type: 'number',
          label: '完成率(%)',
          labelEn: 'Completion Rate(%)',
          required: true,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          id: 'keyFindings',
          type: 'textarea',
          label: '主要发现与成果',
          labelEn: 'Key Findings',
          required: true,
          validation: {
            minLength: 50
          }
        }
      ]
    },
    {
      id: 'milestones',
      title: '里程碑完成情况',
      titleEn: 'Milestone Completion',
      order: 2,
      fields: [
        {
          id: 'milestones',
          type: 'array',
          label: '里程碑列表',
          labelEn: 'Milestone List',
          required: true,
          arrayFields: [
            {
              id: 'milestoneName',
              type: 'text',
              label: '里程碑名称',
              labelEn: 'Milestone Name',
              required: true
            },
            {
              id: 'plannedDate',
              type: 'date',
              label: '计划完成日期',
              labelEn: 'Planned Date',
              required: true
            },
            {
              id: 'actualDate',
              type: 'date',
              label: '实际完成日期',
              labelEn: 'Actual Date',
              required: false
            },
            {
              id: 'status',
              type: 'select',
              label: '状态',
              labelEn: 'Status',
              required: true,
              validation: {
                options: [
                  { value: 'COMPLETED', label: '已完成', labelEn: 'Completed' },
                  { value: 'IN_PROGRESS', label: '进行中', labelEn: 'In Progress' },
                  { value: 'DELAYED', label: '延期', labelEn: 'Delayed' },
                  { value: 'CANCELLED', label: '已取消', labelEn: 'Cancelled' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'challenges-plans',
      title: '问题与计划',
      titleEn: 'Challenges and Plans',
      order: 3,
      fields: [
        {
          id: 'challenges',
          type: 'textarea',
          label: '遇到的主要问题',
          labelEn: 'Main Challenges',
          required: true,
          validation: {
            minLength: 50
          }
        },
        {
          id: 'solutions',
          type: 'textarea',
          label: '解决方案',
          labelEn: 'Solutions',
          required: true,
          validation: {
            minLength: 50
          }
        },
        {
          id: 'nextSemesterPlan',
          type: 'textarea',
          label: '下学期计划',
          labelEn: 'Next Semester Plan',
          required: true,
          validation: {
            minLength: 100
          }
        }
      ]
    },
    {
      id: 'attachments',
      title: '附件材料',
      titleEn: 'Attachments',
      order: 4,
      fields: [
        {
          id: 'progressReport',
          type: 'file',
          label: '详细进展报告',
          labelEn: 'Detailed Progress Report',
          required: false,
          validation: {
            fileTypes: ['pdf', 'doc', 'docx'],
            maxFileSize: 10485760 // 10MB
          }
        },
        {
          id: 'experimentData',
          type: 'file',
          label: '实验数据',
          labelEn: 'Experiment Data',
          required: false,
          validation: {
            fileTypes: ['xlsx', 'csv', 'zip'],
            maxFileSize: 52428800 // 50MB
          }
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['PROFESSOR']
  }
}

// 6. 导师-学生综合评价表
export const studentComprehensiveEvaluationForm: FormSchema = {
  id: 'student-comprehensive-evaluation',
  type: 'COMPREHENSIVE_EVALUATION',
  version: 1,
  title: '学生综合评价表',
  titleEn: 'Student Comprehensive Evaluation Form',
  description: '导师对学生进行综合评价',
  sections: [
    {
      id: 'student-info',
      title: '学生信息',
      titleEn: 'Student Information',
      order: 0,
      fields: [
        {
          id: 'studentName',
          type: 'text',
          label: '学生姓名',
          labelEn: 'Student Name',
          required: true
        },
        {
          id: 'studentId',
          type: 'text',
          label: '学号',
          labelEn: 'Student ID',
          required: true
        },
        {
          id: 'evaluationPeriod',
          type: 'text',
          label: '评价周期',
          labelEn: 'Evaluation Period',
          required: true,
          placeholder: '2024学年'
        }
      ]
    },
    {
      id: 'four-dimensions',
      title: '四维度评价',
      titleEn: 'Four-Dimension Evaluation',
      order: 1,
      fields: [
        {
          id: 'moralDimension',
          type: 'object',
          label: '思想品德(10%)',
          labelEn: 'Moral Character(10%)',
          required: true,
          objectFields: [
            {
              id: 'baseScore',
              type: 'number',
              label: '基础分',
              labelEn: 'Base Score',
              required: true,
              defaultValue: 60,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'additions',
              type: 'array',
              label: '加分项',
              labelEn: 'Additions',
              required: false,
              arrayFields: [
                {
                  id: 'item',
                  type: 'text',
                  label: '加分事项',
                  labelEn: 'Item',
                  required: true
                },
                {
                  id: 'score',
                  type: 'number',
                  label: '加分',
                  labelEn: 'Score',
                  required: true,
                  validation: {
                    min: 0,
                    max: 20
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'academicDimension',
          type: 'object',
          label: '学业成绩(40%)',
          labelEn: 'Academic Performance(40%)',
          required: true,
          objectFields: [
            {
              id: 'gpa',
              type: 'number',
              label: 'GPA',
              labelEn: 'GPA',
              required: true,
              validation: {
                min: 0,
                max: 4.0
              }
            },
            {
              id: 'coreCourseAvg',
              type: 'number',
              label: '核心课程平均分',
              labelEn: 'Core Course Average',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'academicActivities',
              type: 'number',
              label: '学术活动参与次数',
              labelEn: 'Academic Activities',
              required: true,
              validation: {
                min: 0
              }
            }
          ]
        },
        {
          id: 'innovationDimension',
          type: 'object',
          label: '科技创新(30%)',
          labelEn: 'Innovation(30%)',
          required: true,
          objectFields: [
            {
              id: 'papers',
              type: 'number',
              label: '发表论文数',
              labelEn: 'Papers Published',
              required: true,
              validation: {
                min: 0
              }
            },
            {
              id: 'patents',
              type: 'number',
              label: '申请专利数',
              labelEn: 'Patents Applied',
              required: true,
              validation: {
                min: 0
              }
            },
            {
              id: 'competitions',
              type: 'number',
              label: '竞赛获奖数',
              labelEn: 'Competition Awards',
              required: true,
              validation: {
                min: 0
              }
            },
            {
              id: 'projects',
              type: 'number',
              label: '参与项目数',
              labelEn: 'Projects Participated',
              required: true,
              validation: {
                min: 0
              }
            }
          ]
        },
        {
          id: 'researchDimension',
          type: 'object',
          label: '科研推进(20%)',
          labelEn: 'Research Progress(20%)',
          required: true,
          objectFields: [
            {
              id: 'progressScore',
              type: 'number',
              label: '项目进度(0-100)',
              labelEn: 'Progress Score',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'logQuality',
              type: 'number',
              label: '日志质量(0-100)',
              labelEn: 'Log Quality',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            },
            {
              id: 'milestoneCompletion',
              type: 'number',
              label: '里程碑完成率(%)',
              labelEn: 'Milestone Completion',
              required: true,
              validation: {
                min: 0,
                max: 100
              }
            }
          ]
        }
      ]
    },
    {
      id: 'overall-evaluation',
      title: '综合评价',
      titleEn: 'Overall Evaluation',
      order: 2,
      fields: [
        {
          id: 'strengths',
          type: 'textarea',
          label: '主要优点',
          labelEn: 'Strengths',
          required: true,
          validation: {
            minLength: 50,
            maxLength: 500
          }
        },
        {
          id: 'weaknesses',
          type: 'textarea',
          label: '需要改进之处',
          labelEn: 'Areas for Improvement',
          required: true,
          validation: {
            minLength: 50,
            maxLength: 500
          }
        },
        {
          id: 'developmentSuggestions',
          type: 'textarea',
          label: '发展建议',
          labelEn: 'Development Suggestions',
          required: true,
          validation: {
            minLength: 50,
            maxLength: 500
          }
        },
        {
          id: 'overallRating',
          type: 'select',
          label: '综合评定',
          labelEn: 'Overall Rating',
          required: true,
          validation: {
            options: [
              { value: 'A', label: '优秀', labelEn: 'Excellent' },
              { value: 'B', label: '良好', labelEn: 'Good' },
              { value: 'C', label: '合格', labelEn: 'Pass' },
              { value: 'D', label: '不合格', labelEn: 'Fail' }
            ]
          }
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: false
  }
}

// 7. 学生-科研成果统计表
export const researchAchievementStatisticsForm: FormSchema = {
  id: 'research-achievement-statistics',
  type: 'ACHIEVEMENT_STATISTICS',
  version: 1,
  title: '科研成果统计表',
  titleEn: 'Research Achievement Statistics',
  description: '统计学生的科研成果',
  sections: [
    {
      id: 'period-info',
      title: '统计周期',
      titleEn: 'Statistical Period',
      order: 0,
      fields: [
        {
          id: 'year',
          type: 'number',
          label: '年度',
          labelEn: 'Year',
          required: true,
          defaultValue: new Date().getFullYear(),
          validation: {
            min: 2020,
            max: 2030
          }
        },
        {
          id: 'semester',
          type: 'select',
          label: '学期',
          labelEn: 'Semester',
          required: true,
          validation: {
            options: [
              { value: '1', label: '春季学期', labelEn: 'Spring' },
              { value: '2', label: '秋季学期', labelEn: 'Fall' },
              { value: '0', label: '全年', labelEn: 'Full Year' }
            ]
          }
        }
      ]
    },
    {
      id: 'publications',
      title: '论文发表',
      titleEn: 'Publications',
      order: 1,
      fields: [
        {
          id: 'papers',
          type: 'array',
          label: '论文列表',
          labelEn: 'Paper List',
          required: false,
          arrayFields: [
            {
              id: 'title',
              type: 'text',
              label: '论文标题',
              labelEn: 'Paper Title',
              required: true
            },
            {
              id: 'authors',
              type: 'text',
              label: '作者列表',
              labelEn: 'Authors',
              required: true
            },
            {
              id: 'authorOrder',
              type: 'number',
              label: '作者排序',
              labelEn: 'Author Order',
              required: true,
              validation: {
                min: 1
              }
            },
            {
              id: 'journal',
              type: 'text',
              label: '期刊/会议',
              labelEn: 'Journal/Conference',
              required: true
            },
            {
              id: 'paperType',
              type: 'select',
              label: '论文类型',
              labelEn: 'Paper Type',
              required: true,
              validation: {
                options: [
                  { value: 'SCI', label: 'SCI', labelEn: 'SCI' },
                  { value: 'EI', label: 'EI', labelEn: 'EI' },
                  { value: 'CORE', label: '核心期刊', labelEn: 'Core Journal' },
                  { value: 'GENERAL', label: '普通期刊', labelEn: 'General Journal' }
                ]
              }
            },
            {
              id: 'publicationDate',
              type: 'date',
              label: '发表日期',
              labelEn: 'Publication Date',
              required: true
            },
            {
              id: 'doi',
              type: 'text',
              label: 'DOI',
              labelEn: 'DOI',
              required: false
            }
          ]
        }
      ]
    },
    {
      id: 'patents',
      title: '专利申请',
      titleEn: 'Patents',
      order: 2,
      fields: [
        {
          id: 'patents',
          type: 'array',
          label: '专利列表',
          labelEn: 'Patent List',
          required: false,
          arrayFields: [
            {
              id: 'patentName',
              type: 'text',
              label: '专利名称',
              labelEn: 'Patent Name',
              required: true
            },
            {
              id: 'patentType',
              type: 'select',
              label: '专利类型',
              labelEn: 'Patent Type',
              required: true,
              validation: {
                options: [
                  { value: 'INVENTION', label: '发明专利', labelEn: 'Invention' },
                  { value: 'UTILITY', label: '实用新型', labelEn: 'Utility Model' },
                  { value: 'DESIGN', label: '外观设计', labelEn: 'Design' }
                ]
              }
            },
            {
              id: 'inventorOrder',
              type: 'number',
              label: '发明人排序',
              labelEn: 'Inventor Order',
              required: true,
              validation: {
                min: 1
              }
            },
            {
              id: 'applicationNumber',
              type: 'text',
              label: '申请号',
              labelEn: 'Application Number',
              required: true
            },
            {
              id: 'applicationDate',
              type: 'date',
              label: '申请日期',
              labelEn: 'Application Date',
              required: true
            },
            {
              id: 'status',
              type: 'select',
              label: '状态',
              labelEn: 'Status',
              required: true,
              validation: {
                options: [
                  { value: 'PENDING', label: '申请中', labelEn: 'Pending' },
                  { value: 'GRANTED', label: '已授权', labelEn: 'Granted' },
                  { value: 'REJECTED', label: '已驳回', labelEn: 'Rejected' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'competitions',
      title: '竞赛获奖',
      titleEn: 'Competition Awards',
      order: 3,
      fields: [
        {
          id: 'competitions',
          type: 'array',
          label: '竞赛列表',
          labelEn: 'Competition List',
          required: false,
          arrayFields: [
            {
              id: 'competitionName',
              type: 'text',
              label: '竞赛名称',
              labelEn: 'Competition Name',
              required: true
            },
            {
              id: 'level',
              type: 'select',
              label: '竞赛级别',
              labelEn: 'Level',
              required: true,
              validation: {
                options: [
                  { value: 'INTERNATIONAL', label: '国际级', labelEn: 'International' },
                  { value: 'NATIONAL', label: '国家级', labelEn: 'National' },
                  { value: 'PROVINCIAL', label: '省部级', labelEn: 'Provincial' },
                  { value: 'SCHOOL', label: '校级', labelEn: 'School' }
                ]
              }
            },
            {
              id: 'award',
              type: 'select',
              label: '获奖等级',
              labelEn: 'Award Level',
              required: true,
              validation: {
                options: [
                  { value: 'FIRST', label: '一等奖', labelEn: 'First Prize' },
                  { value: 'SECOND', label: '二等奖', labelEn: 'Second Prize' },
                  { value: 'THIRD', label: '三等奖', labelEn: 'Third Prize' },
                  { value: 'EXCELLENCE', label: '优秀奖', labelEn: 'Excellence Award' }
                ]
              }
            },
            {
              id: 'teamMembers',
              type: 'text',
              label: '团队成员',
              labelEn: 'Team Members',
              required: false
            },
            {
              id: 'awardDate',
              type: 'date',
              label: '获奖日期',
              labelEn: 'Award Date',
              required: true
            }
          ]
        }
      ]
    },
    {
      id: 'other-achievements',
      title: '其他成果',
      titleEn: 'Other Achievements',
      order: 4,
      fields: [
        {
          id: 'softwareCopyrights',
          type: 'number',
          label: '软件著作权数量',
          labelEn: 'Software Copyrights',
          required: true,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          id: 'projectsParticipated',
          type: 'array',
          label: '参与项目',
          labelEn: 'Projects Participated',
          required: false,
          arrayFields: [
            {
              id: 'projectName',
              type: 'text',
              label: '项目名称',
              labelEn: 'Project Name',
              required: true
            },
            {
              id: 'role',
              type: 'select',
              label: '角色',
              labelEn: 'Role',
              required: true,
              validation: {
                options: [
                  { value: 'LEADER', label: '负责人', labelEn: 'Leader' },
                  { value: 'MEMBER', label: '成员', labelEn: 'Member' }
                ]
              }
            },
            {
              id: 'projectLevel',
              type: 'select',
              label: '项目级别',
              labelEn: 'Project Level',
              required: true,
              validation: {
                options: [
                  { value: 'NATIONAL', label: '国家级', labelEn: 'National' },
                  { value: 'PROVINCIAL', label: '省部级', labelEn: 'Provincial' },
                  { value: 'SCHOOL', label: '校级', labelEn: 'School' }
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['PROFESSOR', 'SECRETARY']
  }
}

// 8. 导师-项目结题评审表
export const projectClosureReviewForm: FormSchema = {
  id: 'project-closure-review',
  type: 'PROJECT_CLOSURE',
  version: 1,
  title: '项目结题评审表',
  titleEn: 'Project Closure Review Form',
  description: '导师对项目进行结题评审',
  sections: [
    {
      id: 'project-info',
      title: '项目信息',
      titleEn: 'Project Information',
      order: 0,
      fields: [
        {
          id: 'projectCode',
          type: 'text',
          label: '项目编号',
          labelEn: 'Project Code',
          required: true
        },
        {
          id: 'projectTitle',
          type: 'text',
          label: '项目名称',
          labelEn: 'Project Title',
          required: true
        },
        {
          id: 'studentName',
          type: 'text',
          label: '项目负责人',
          labelEn: 'Project Leader',
          required: true
        },
        {
          id: 'projectDuration',
          type: 'text',
          label: '项目周期',
          labelEn: 'Project Duration',
          required: true,
          placeholder: '2023.09-2024.06'
        },
        {
          id: 'projectType',
          type: 'select',
          label: '项目类型',
          labelEn: 'Project Type',
          required: true,
          validation: {
            options: [
              { value: 'INNOVATION', label: '创新项目', labelEn: 'Innovation' },
              { value: 'ENTERPRISE', label: '企业项目', labelEn: 'Enterprise' }
            ]
          }
        }
      ]
    },
    {
      id: 'completion-assessment',
      title: '完成情况评估',
      titleEn: 'Completion Assessment',
      order: 1,
      fields: [
        {
          id: 'objectivesAchieved',
          type: 'radio',
          label: '项目目标达成情况',
          labelEn: 'Objectives Achievement',
          required: true,
          validation: {
            options: [
              { value: 'FULLY', label: '完全达成', labelEn: 'Fully Achieved' },
              { value: 'MOSTLY', label: '基本达成', labelEn: 'Mostly Achieved' },
              { value: 'PARTIALLY', label: '部分达成', labelEn: 'Partially Achieved' },
              { value: 'NOT', label: '未达成', labelEn: 'Not Achieved' }
            ]
          }
        },
        {
          id: 'deliverables',
          type: 'textarea',
          label: '主要成果产出',
          labelEn: 'Main Deliverables',
          required: true,
          validation: {
            minLength: 100
          }
        },
        {
          id: 'technicalInnovation',
          type: 'textarea',
          label: '技术创新点',
          labelEn: 'Technical Innovation',
          required: true,
          validation: {
            minLength: 50
          }
        },
        {
          id: 'implementationQuality',
          type: 'number',
          label: '实施质量评分(30分)',
          labelEn: 'Implementation Quality(30)',
          required: true,
          validation: {
            min: 0,
            max: 30
          }
        }
      ]
    },
    {
      id: 'achievement-evaluation',
      title: '成果评价',
      titleEn: 'Achievement Evaluation',
      order: 2,
      fields: [
        {
          id: 'researchDepth',
          type: 'number',
          label: '研究深度(20分)',
          labelEn: 'Research Depth(20)',
          required: true,
          validation: {
            min: 0,
            max: 20
          }
        },
        {
          id: 'innovationLevel',
          type: 'number',
          label: '创新程度(20分)',
          labelEn: 'Innovation Level(20)',
          required: true,
          validation: {
            min: 0,
            max: 20
          }
        },
        {
          id: 'practicalValue',
          type: 'number',
          label: '实用价值(15分)',
          labelEn: 'Practical Value(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        },
        {
          id: 'documentQuality',
          type: 'number',
          label: '文档质量(15分)',
          labelEn: 'Document Quality(15)',
          required: true,
          validation: {
            min: 0,
            max: 15
          }
        }
      ]
    },
    {
      id: 'final-review',
      title: '最终评审',
      titleEn: 'Final Review',
      order: 3,
      fields: [
        {
          id: 'totalScore',
          type: 'number',
          label: '总分(100分)',
          labelEn: 'Total Score(100)',
          required: true,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          id: 'reviewResult',
          type: 'select',
          label: '评审结果',
          labelEn: 'Review Result',
          required: true,
          validation: {
            options: [
              { value: 'EXCELLENT', label: '优秀(90-100)', labelEn: 'Excellent(90-100)' },
              { value: 'GOOD', label: '良好(80-89)', labelEn: 'Good(80-89)' },
              { value: 'PASS', label: '合格(60-79)', labelEn: 'Pass(60-79)' },
              { value: 'FAIL', label: '不合格(<60)', labelEn: 'Fail(<60)' }
            ]
          }
        },
        {
          id: 'reviewComments',
          type: 'textarea',
          label: '评审意见',
          labelEn: 'Review Comments',
          required: true,
          validation: {
            minLength: 100,
            maxLength: 1000
          }
        },
        {
          id: 'recommendations',
          type: 'checkbox',
          label: '推荐意见',
          labelEn: 'Recommendations',
          required: false,
          validation: {
            options: [
              { value: 'PUBLISH', label: '推荐发表', labelEn: 'Recommend for Publication' },
              { value: 'PATENT', label: '推荐申请专利', labelEn: 'Recommend for Patent' },
              { value: 'AWARD', label: '推荐申报奖项', labelEn: 'Recommend for Award' },
              { value: 'CONTINUE', label: '推荐继续深入研究', labelEn: 'Recommend Further Research' }
            ]
          }
        },
        {
          id: 'reviewerName',
          type: 'text',
          label: '评审人',
          labelEn: 'Reviewer',
          required: true
        },
        {
          id: 'reviewDate',
          type: 'date',
          label: '评审日期',
          labelEn: 'Review Date',
          required: true,
          defaultValue: new Date().toISOString().split('T')[0]
        }
      ]
    }
  ],
  workflow: {
    requiresApproval: true,
    approvers: ['ADMIN', 'SECRETARY'],
    notifications: {
      onSubmit: ['STUDENT'],
      onApprove: ['STUDENT', 'SECRETARY'],
      onReject: ['STUDENT']
    }
  }
}

// Export all form templates
export const formTemplates: Record<string, FormSchema> = {
  INNOVATION_DECLARATION: innovationDeclarationForm,
  MIDTERM_CHECK: midtermCheckForm,
  DAILY_GUIDANCE: dailyGuidanceSummaryForm,
  LAB_ROTATION_ASSESSMENT: labRotationAssessmentForm,
  SEMESTER_PROGRESS: semesterProgressReportForm,
  COMPREHENSIVE_EVALUATION: studentComprehensiveEvaluationForm,
  ACHIEVEMENT_STATISTICS: researchAchievementStatisticsForm,
  PROJECT_CLOSURE: projectClosureReviewForm
}

// Helper function to get form template by type
export function getFormTemplate(type: string): FormSchema | null {
  return formTemplates[type] || null
}

// Helper function to list all available form types
export function listFormTypes(): Array<{ type: string; title: string; titleEn: string }> {
  return Object.entries(formTemplates).map(([type, template]) => ({
    type,
    title: template.title,
    titleEn: template.titleEn || template.title
  }))
}