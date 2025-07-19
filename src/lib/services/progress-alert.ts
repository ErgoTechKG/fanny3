import type { ProjectMilestone, AlertLevel, MilestoneProgressStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface AlertNotification {
  milestoneId: string
  projectId: string
  studentId: string
  alertLevel: AlertLevel
  message: string
  daysOverdue?: number
}

export class ProgressAlertService {
  /**
   * Calculate alert level based on milestone due date and status
   */
  calculateAlertLevel(milestone: ProjectMilestone): AlertLevel {
    const now = new Date()
    const dueDate = new Date(milestone.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // If completed, always green
    if (milestone.status === MilestoneProgressStatus.COMPLETED) {
      return AlertLevel.GREEN
    }
    
    // If already marked as at risk or delayed, use appropriate level
    if (milestone.status === MilestoneProgressStatus.DELAYED || daysUntilDue < 0) {
      return AlertLevel.RED
    }
    
    if (milestone.status === MilestoneProgressStatus.AT_RISK || daysUntilDue < 7) {
      return AlertLevel.YELLOW
    }
    
    return AlertLevel.GREEN
  }

  /**
   * Check all milestones for a project and update alert levels
   */
  async checkProjectMilestones(projectId: string): Promise<AlertNotification[]> {
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId },
      include: {
        project: {
          include: {
            student: true
          }
        }
      }
    })
    
    const alerts: AlertNotification[] = []
    
    for (const milestone of milestones) {
      const newAlertLevel = this.calculateAlertLevel(milestone)
      
      // Update if alert level changed
      if (milestone.alertLevel !== newAlertLevel) {
        await prisma.projectMilestone.update({
          where: { id: milestone.id },
          data: { alertLevel: newAlertLevel }
        })
        
        // Create notification if it's yellow or red
        if (newAlertLevel !== AlertLevel.GREEN) {
          const daysOverdue = this.calculateDaysOverdue(milestone.dueDate)
          alerts.push({
            milestoneId: milestone.id,
            projectId: milestone.projectId,
            studentId: milestone.project.studentId,
            alertLevel: newAlertLevel,
            message: this.generateAlertMessage(milestone, newAlertLevel, daysOverdue),
            daysOverdue: daysOverdue > 0 ? daysOverdue : undefined
          })
        }
      }
    }
    
    return alerts
  }

  /**
   * Check all active projects for alerts
   */
  async checkAllActiveProjects(): Promise<AlertNotification[]> {
    const activeProjects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    })
    
    const allAlerts: AlertNotification[] = []
    
    for (const project of activeProjects) {
      const projectAlerts = await this.checkProjectMilestones(project.id)
      allAlerts.push(...projectAlerts)
    }
    
    return allAlerts
  }

  /**
   * Get milestone statistics for a project
   */
  async getProjectMilestoneStats(projectId: string) {
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId }
    })
    
    const stats = {
      total: milestones.length,
      completed: 0,
      onTrack: 0,
      atRisk: 0,
      delayed: 0,
      completionRate: 0,
      healthScore: 0
    }
    
    for (const milestone of milestones) {
      switch (milestone.status) {
        case MilestoneProgressStatus.COMPLETED:
          stats.completed++
          break
        case MilestoneProgressStatus.IN_PROGRESS:
          if (milestone.alertLevel === AlertLevel.GREEN) {
            stats.onTrack++
          } else if (milestone.alertLevel === AlertLevel.YELLOW) {
            stats.atRisk++
          }
          break
        case MilestoneProgressStatus.DELAYED:
          stats.delayed++
          break
        case MilestoneProgressStatus.AT_RISK:
          stats.atRisk++
          break
      }
    }
    
    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    
    // Calculate health score (0-100)
    // Completed: +100, On Track: +80, At Risk: +40, Delayed: +0
    const totalScore = 
      stats.completed * 100 + 
      stats.onTrack * 80 + 
      stats.atRisk * 40 + 
      stats.delayed * 0
    
    stats.healthScore = stats.total > 0 ? totalScore / stats.total : 0
    
    return stats
  }

  /**
   * Get upcoming milestones with alerts
   */
  async getUpcomingMilestonesWithAlerts(
    studentId?: string,
    daysAhead: number = 30
  ) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)
    
    const where = {
      dueDate: {
        gte: new Date(),
        lte: futureDate
      },
      status: {
        not: MilestoneProgressStatus.COMPLETED
      },
      ...(studentId && {
        project: {
          studentId
        }
      })
    }
    
    const milestones = await prisma.projectMilestone.findMany({
      where,
      include: {
        project: {
          include: {
            topic: true,
            student: true,
            advisor: true
          }
        },
        feedback: {
          include: {
            professor: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    return milestones.map(milestone => ({
      ...milestone,
      daysUntilDue: this.calculateDaysUntilDue(milestone.dueDate),
      isOverdue: new Date() > new Date(milestone.dueDate)
    }))
  }

  /**
   * Send alert notifications (placeholder - implement with your notification system)
   */
  async sendAlerts(alerts: AlertNotification[]): Promise<void> {
    // Group alerts by student
    const alertsByStudent = alerts.reduce((acc, alert) => {
      if (!acc[alert.studentId]) {
        acc[alert.studentId] = []
      }
      acc[alert.studentId].push(alert)
      return acc
    }, {} as Record<string, AlertNotification[]>)
    
    // Send notifications to each student
    for (const [studentId, studentAlerts] of Object.entries(alertsByStudent)) {
      // TODO: Implement actual notification sending
      // This could be email, in-app notification, WeChat, etc.
      console.log(`Sending ${studentAlerts.length} alerts to student ${studentId}`)
    }
    
    // Also notify advisors for RED alerts
    const redAlerts = alerts.filter(a => a.alertLevel === AlertLevel.RED)
    if (redAlerts.length > 0) {
      // TODO: Notify advisors
      console.log(`Notifying advisors about ${redAlerts.length} critical alerts`)
    }
  }

  /**
   * Update milestone status based on completion
   */
  async updateMilestoneProgress(
    milestoneId: string,
    progress: number,
    completed: boolean = false
  ) {
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId }
    })
    
    if (!milestone) {
      throw new Error('Milestone not found')
    }
    
    let newStatus = milestone.status
    
    if (completed) {
      newStatus = MilestoneProgressStatus.COMPLETED
    } else if (progress > 0 && progress < 100) {
      newStatus = MilestoneProgressStatus.IN_PROGRESS
    }
    
    const alertLevel = completed ? AlertLevel.GREEN : this.calculateAlertLevel(milestone)
    
    return await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        status: newStatus,
        alertLevel,
        ...(completed && { completedAt: new Date() })
      }
    })
  }

  // Helper methods
  private calculateDaysUntilDue(dueDate: Date): number {
    const now = new Date()
    return Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateDaysOverdue(dueDate: Date): number {
    const now = new Date()
    const overdue = Math.ceil((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return overdue > 0 ? overdue : 0
  }

  private generateAlertMessage(
    milestone: ProjectMilestone,
    alertLevel: AlertLevel,
    daysOverdue: number
  ): string {
    if (alertLevel === AlertLevel.RED) {
      if (daysOverdue > 0) {
        return `里程碑"${milestone.name}"已逾期${daysOverdue}天，请尽快完成`
      }
      return `里程碑"${milestone.name}"已严重延迟，需要立即关注`
    }
    
    if (alertLevel === AlertLevel.YELLOW) {
      const daysUntilDue = this.calculateDaysUntilDue(milestone.dueDate)
      return `里程碑"${milestone.name}"即将到期（剩余${daysUntilDue}天），请加快进度`
    }
    
    return `里程碑"${milestone.name}"进展正常`
  }
}