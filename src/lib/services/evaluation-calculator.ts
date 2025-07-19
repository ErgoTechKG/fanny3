import type { Achievement, AchievementType } from '@prisma/client'

export interface MoralData {
  base: number
  additions: Array<{
    item: string
    score: number
    proof: string
  }>
  deductions: Array<{
    item: string
    score: number
    reason: string
  }>
}

export interface AcademicData {
  gpa: number
  maxGpa: number
  coreCourseAvg: number
  activityCount: number
}

export interface Paper {
  type: 'SCI' | 'EI' | '核心期刊' | '普通期刊'
  authorOrder: number
  impactFactor?: number
}

export interface Patent {
  type: 'INVENTION' | 'UTILITY' | 'DESIGN'
  inventorOrder: number
}

export interface Competition {
  level: 'INTERNATIONAL' | 'NATIONAL' | 'PROVINCIAL' | 'SCHOOL'
  award: 'FIRST' | 'SECOND' | 'THIRD' | 'EXCELLENCE'
  teamSize?: number
}

export interface InnovationData {
  papers: Paper[]
  patents: Patent[]
  competitions: Competition[]
  projects: Array<{
    level: 'NATIONAL' | 'PROVINCIAL' | 'SCHOOL'
    role: 'LEADER' | 'MEMBER'
  }>
  softwareCopyrights: number
}

export interface ResearchData {
  progressScore: number     // 0-100: 项目进度完成度
  logQuality: number       // 0-100: 日志质量评分
  mentorScore: number      // 0-100: 导师评价
  milestoneCompletion: number // 0-100: 里程碑完成率
}

export interface EvaluationData {
  moral: MoralData
  academic: AcademicData
  innovation: InnovationData
  research: ResearchData
}

export interface EvaluationResult {
  moral: number
  academic: number
  innovation: number
  research: number
  total: number
  rank: 'A' | 'B' | 'C' | 'D'
  details?: {
    [key: string]: any
  }
}

export class EvaluationCalculator {
  private weights = {
    moral: 0.1,      // 思想品德 10%
    academic: 0.4,   // 学业成绩 40%
    innovation: 0.3, // 科技创新 30%
    research: 0.2    // 科研推进 20%
  }

  /**
   * Calculate comprehensive evaluation score
   */
  calculate(data: EvaluationData): EvaluationResult {
    const scores = {
      moral: this.calculateMoral(data.moral),
      academic: this.calculateAcademic(data.academic),
      innovation: this.calculateInnovation(data.innovation),
      research: this.calculateResearch(data.research)
    }
    
    const total = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * this.weights[key as keyof typeof this.weights],
      0
    )
    
    return {
      ...scores,
      total,
      rank: this.getRank(total),
      details: this.getCalculationDetails(data, scores)
    }
  }

  /**
   * Calculate moral score (思想品德)
   * Base: 60, max: 100
   */
  private calculateMoral(moral: MoralData): number {
    let score = moral.base || 60
    
    // Add bonus points
    for (const addition of moral.additions) {
      score += addition.score
    }
    
    // Subtract penalty points
    for (const deduction of moral.deductions) {
      score -= deduction.score
    }
    
    // Ensure score is within 0-100
    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculate academic score (学业成绩)
   * GPA: 60%, Core courses: 30%, Activities: 10%
   */
  private calculateAcademic(academic: AcademicData): number {
    // GPA score (60%)
    const gpaScore = (academic.gpa / academic.maxGpa) * 100 * 0.6
    
    // Core course average (30%)
    const coreScore = academic.coreCourseAvg * 0.3
    
    // Academic activities (10%)
    const activityScore = Math.min(10, academic.activityCount * 2)
    
    return gpaScore + coreScore + activityScore
  }

  /**
   * Calculate innovation score (科技创新)
   * Based on papers, patents, competitions, projects
   */
  private calculateInnovation(innovation: InnovationData): number {
    let score = 0
    
    // Paper scoring
    for (const paper of innovation.papers) {
      score += this.calculatePaperScore(paper)
    }
    
    // Patent scoring
    for (const patent of innovation.patents) {
      score += this.calculatePatentScore(patent)
    }
    
    // Competition scoring
    for (const comp of innovation.competitions) {
      score += this.calculateCompetitionScore(comp)
    }
    
    // Project scoring
    for (const project of innovation.projects) {
      if (project.level === 'NATIONAL' && project.role === 'LEADER') {
        score += 30
      } else if (project.level === 'NATIONAL' && project.role === 'MEMBER') {
        score += 15
      } else if (project.level === 'PROVINCIAL' && project.role === 'LEADER') {
        score += 20
      } else if (project.level === 'PROVINCIAL' && project.role === 'MEMBER') {
        score += 10
      } else if (project.level === 'SCHOOL' && project.role === 'LEADER') {
        score += 10
      } else if (project.level === 'SCHOOL' && project.role === 'MEMBER') {
        score += 5
      }
    }
    
    // Software copyrights
    score += innovation.softwareCopyrights * 10
    
    return Math.min(100, score)
  }

  /**
   * Calculate research progress score (科研推进)
   * Progress: 40%, Log quality: 20%, Mentor evaluation: 30%, Milestones: 10%
   */
  private calculateResearch(research: ResearchData): number {
    const progressScore = research.progressScore * 0.4
    const logScore = research.logQuality * 0.2
    const mentorScore = research.mentorScore * 0.3
    const milestoneScore = research.milestoneCompletion * 0.1
    
    return progressScore + logScore + mentorScore + milestoneScore
  }

  /**
   * Calculate paper score based on type and author order
   */
  private calculatePaperScore(paper: Paper): number {
    const baseScores = {
      'SCI': { first: 40, second: 20, other: 10 },
      'EI': { first: 30, second: 15, other: 8 },
      '核心期刊': { first: 20, second: 10, other: 5 },
      '普通期刊': { first: 10, second: 5, other: 3 }
    }
    
    const scores = baseScores[paper.type]
    
    if (paper.authorOrder === 1) return scores.first
    if (paper.authorOrder === 2) return scores.second
    return scores.other
  }

  /**
   * Calculate patent score based on type and inventor order
   */
  private calculatePatentScore(patent: Patent): number {
    const baseScores = {
      'INVENTION': { first: 30, second: 20, third: 15, other: 10 },
      'UTILITY': { first: 15, second: 10, third: 8, other: 5 },
      'DESIGN': { first: 10, second: 7, third: 5, other: 3 }
    }
    
    const scores = baseScores[patent.type]
    
    if (patent.inventorOrder === 1) return scores.first
    if (patent.inventorOrder === 2) return scores.second
    if (patent.inventorOrder === 3) return scores.third
    return scores.other
  }

  /**
   * Calculate competition score based on level and award
   */
  private calculateCompetitionScore(comp: Competition): number {
    const scoreMatrix = {
      'INTERNATIONAL': { 'FIRST': 50, 'SECOND': 40, 'THIRD': 30, 'EXCELLENCE': 20 },
      'NATIONAL': { 'FIRST': 40, 'SECOND': 30, 'THIRD': 20, 'EXCELLENCE': 15 },
      'PROVINCIAL': { 'FIRST': 25, 'SECOND': 20, 'THIRD': 15, 'EXCELLENCE': 10 },
      'SCHOOL': { 'FIRST': 15, 'SECOND': 10, 'THIRD': 8, 'EXCELLENCE': 5 }
    }
    
    let score = scoreMatrix[comp.level][comp.award]
    
    // Adjust for team size if provided
    if (comp.teamSize && comp.teamSize > 1) {
      // Reduce score for larger teams
      score = score * (1 - (comp.teamSize - 1) * 0.1)
      score = Math.max(score * 0.5, score) // Minimum 50% of original score
    }
    
    return Math.round(score)
  }

  /**
   * Get rank based on total score
   */
  private getRank(totalScore: number): 'A' | 'B' | 'C' | 'D' {
    if (totalScore >= 90) return 'A'
    if (totalScore >= 80) return 'B'
    if (totalScore >= 70) return 'C'
    return 'D'
  }

  /**
   * Get detailed calculation breakdown
   */
  private getCalculationDetails(data: EvaluationData, scores: any): any {
    return {
      moral: {
        base: data.moral.base,
        additions: data.moral.additions.reduce((sum, a) => sum + a.score, 0),
        deductions: data.moral.deductions.reduce((sum, d) => sum + d.score, 0),
        final: scores.moral
      },
      academic: {
        gpaScore: (data.academic.gpa / data.academic.maxGpa) * 100 * 0.6,
        coreScore: data.academic.coreCourseAvg * 0.3,
        activityScore: Math.min(10, data.academic.activityCount * 2),
        final: scores.academic
      },
      innovation: {
        paperCount: data.innovation.papers.length,
        patentCount: data.innovation.patents.length,
        competitionCount: data.innovation.competitions.length,
        projectCount: data.innovation.projects.length,
        final: scores.innovation
      },
      research: {
        progress: data.research.progressScore * 0.4,
        logQuality: data.research.logQuality * 0.2,
        mentorEval: data.research.mentorScore * 0.3,
        milestones: data.research.milestoneCompletion * 0.1,
        final: scores.research
      }
    }
  }

  /**
   * Convert achievements to innovation data
   */
  static achievementsToInnovationData(achievements: Achievement[]): Partial<InnovationData> {
    const papers: Paper[] = []
    const patents: Patent[] = []
    const competitions: Competition[] = []
    let softwareCopyrights = 0
    
    for (const achievement of achievements) {
      if (achievement.type === AchievementType.PAPER) {
        // Parse paper info from title/description
        // This is simplified - in real implementation, you'd have structured data
        papers.push({
          type: 'SCI', // Would parse from achievement data
          authorOrder: 1 // Would parse from achievement data
        })
      } else if (achievement.type === AchievementType.PATENT) {
        patents.push({
          type: 'INVENTION',
          inventorOrder: 1
        })
      } else if (achievement.type === AchievementType.COMPETITION) {
        competitions.push({
          level: 'NATIONAL',
          award: 'FIRST'
        })
      } else if (achievement.type === AchievementType.SOFTWARE_COPYRIGHT) {
        softwareCopyrights++
      }
    }
    
    return {
      papers,
      patents,
      competitions,
      softwareCopyrights,
      projects: []
    }
  }
}