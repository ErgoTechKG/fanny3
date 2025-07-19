import type { LabRotationApplication } from '@prisma/client'

export interface RotationChoice {
  order: number
  labId: string
  reason: string
}

export interface RotationAssignment {
  studentId: string
  labId: string
  matchRound: number // Which choice (1, 2, or 3)
}

export interface RotationStats {
  totalApplications: number
  assigned: number
  firstChoiceAssignments: number
  secondChoiceAssignments: number
  thirdChoiceAssignments: number
  unassigned: number
}

export class LabRotationAllocator {
  private labCapacity: Map<string, number>
  private labAssignments: Map<string, Set<string>>
  private studentAssignment: Map<string, string>
  private assignmentRound: Map<string, number>

  constructor() {
    this.labCapacity = new Map()
    this.labAssignments = new Map()
    this.studentAssignment = new Map()
    this.assignmentRound = new Map()
  }

  /**
   * Allocate students to labs based on their preferences
   */
  allocate(
    applications: LabRotationApplication[],
    labCapacities: Map<string, number>
  ): {
    assignments: RotationAssignment[]
    stats: RotationStats
  } {
    // Initialize
    this.initialize(labCapacities)
    
    // Process applications in rounds
    this.processApplications(applications)
    
    // Return results
    return {
      assignments: this.getAssignments(),
      stats: this.getStats(applications.length)
    }
  }

  private initialize(labCapacities: Map<string, number>) {
    this.labCapacity.clear()
    this.labAssignments.clear()
    this.studentAssignment.clear()
    this.assignmentRound.clear()

    // Set up lab capacities
    for (const [labId, capacity] of labCapacities) {
      this.labCapacity.set(labId, capacity)
      this.labAssignments.set(labId, new Set())
    }
  }

  private processApplications(applications: LabRotationApplication[]) {
    // Process in 3 rounds for 3 choices
    for (let round = 1; round <= 3; round++) {
      // Process each unassigned application
      for (const app of applications) {
        // Skip if already assigned
        if (this.studentAssignment.has(app.studentId)) continue
        
        // Get choices from JSON
        const choices = app.choices as RotationChoice[]
        const choice = choices.find(c => c.order === round)
        
        if (choice) {
          // Try to assign to this lab
          if (this.assignToLab(app.studentId, choice.labId)) {
            this.assignmentRound.set(app.studentId, round)
          }
        }
      }
    }
  }

  private assignToLab(studentId: string, labId: string): boolean {
    const capacity = this.labCapacity.get(labId) || 0
    const currentAssignments = this.labAssignments.get(labId) || new Set()
    
    // Check if lab has capacity
    if (currentAssignments.size < capacity) {
      currentAssignments.add(studentId)
      this.studentAssignment.set(studentId, labId)
      return true
    }
    
    return false
  }

  private getAssignments(): RotationAssignment[] {
    const assignments: RotationAssignment[] = []
    
    for (const [studentId, labId] of this.studentAssignment) {
      assignments.push({
        studentId,
        labId,
        matchRound: this.assignmentRound.get(studentId) || 0
      })
    }
    
    return assignments
  }

  private getStats(totalApplications: number): RotationStats {
    let firstChoiceAssignments = 0
    let secondChoiceAssignments = 0
    let thirdChoiceAssignments = 0
    
    for (const [_, round] of this.assignmentRound) {
      switch (round) {
        case 1:
          firstChoiceAssignments++
          break
        case 2:
          secondChoiceAssignments++
          break
        case 3:
          thirdChoiceAssignments++
          break
      }
    }
    
    const assigned = this.studentAssignment.size
    
    return {
      totalApplications,
      assigned,
      firstChoiceAssignments,
      secondChoiceAssignments,
      thirdChoiceAssignments,
      unassigned: totalApplications - assigned
    }
  }

  /**
   * Get remaining capacity for each lab
   */
  getRemainingCapacity(): Map<string, number> {
    const remaining = new Map<string, number>()
    
    for (const [labId, capacity] of this.labCapacity) {
      const assigned = this.labAssignments.get(labId)?.size || 0
      remaining.set(labId, capacity - assigned)
    }
    
    return remaining
  }

  /**
   * Get list of unassigned students
   */
  getUnassignedStudents(applications: LabRotationApplication[]): string[] {
    const unassigned: string[] = []
    
    for (const app of applications) {
      if (!this.studentAssignment.has(app.studentId)) {
        unassigned.push(app.studentId)
      }
    }
    
    return unassigned
  }

  /**
   * Optimize assignments to maximize satisfaction
   * This is an advanced method that tries to improve the initial assignment
   */
  optimizeAssignments(applications: LabRotationApplication[]): number {
    let improvements = 0
    let improved = true
    
    while (improved) {
      improved = false
      
      // Try to improve each student's assignment
      for (const app of applications) {
        const currentLab = this.studentAssignment.get(app.studentId)
        const currentRound = this.assignmentRound.get(app.studentId)
        
        if (!currentLab || !currentRound || currentRound === 1) continue
        
        // Try to get a better choice
        const choices = app.choices as RotationChoice[]
        
        for (let betterRound = 1; betterRound < currentRound; betterRound++) {
          const betterChoice = choices.find(c => c.order === betterRound)
          
          if (betterChoice) {
            // Check if we can swap or move
            if (this.tryImproveAssignment(app.studentId, currentLab, betterChoice.labId, betterRound)) {
              improvements++
              improved = true
              break
            }
          }
        }
      }
    }
    
    return improvements
  }

  private tryImproveAssignment(
    studentId: string,
    currentLabId: string,
    targetLabId: string,
    newRound: number
  ): boolean {
    const targetAssignments = this.labAssignments.get(targetLabId) || new Set()
    const targetCapacity = this.labCapacity.get(targetLabId) || 0
    
    // Simple case: target lab has space
    if (targetAssignments.size < targetCapacity) {
      // Remove from current lab
      const currentAssignments = this.labAssignments.get(currentLabId)
      if (currentAssignments) {
        currentAssignments.delete(studentId)
      }
      
      // Add to target lab
      targetAssignments.add(studentId)
      this.studentAssignment.set(studentId, targetLabId)
      this.assignmentRound.set(studentId, newRound)
      
      return true
    }
    
    // Complex case: try to find a swap
    // This could be extended to find chains of swaps
    // For now, we'll keep it simple
    
    return false
  }
}