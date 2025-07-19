import type { MentorApplication } from '@prisma/client'

export interface StudentPreference {
  studentId: string
  choices: Array<{
    mentorId: string
    order: number
    reason: string
  }>
  gpa?: number
  researchScore?: number
}

export interface MentorPreference {
  mentorId: string
  capacity: number
  preferredStudents?: string[] // Ordered by preference
}

export interface MatchingResult {
  studentId: string
  mentorId: string
  matchRound: number // 1, 2, or 3
}

export interface MatchingStats {
  totalStudents: number
  matchedStudents: number
  firstChoiceMatches: number
  secondChoiceMatches: number
  thirdChoiceMatches: number
  unmatchedStudents: number
}

export class GaleShapleyMatcher {
  private studentPreferences: Map<string, string[]>
  private mentorPreferences: Map<string, string[]>
  private mentorCapacity: Map<string, number>
  private mentorAccepted: Map<string, Set<string>>
  private studentMatched: Map<string, string>
  private matchRound: Map<string, number>

  constructor() {
    this.studentPreferences = new Map()
    this.mentorPreferences = new Map()
    this.mentorCapacity = new Map()
    this.mentorAccepted = new Map()
    this.studentMatched = new Map()
    this.matchRound = new Map()
  }

  /**
   * Main matching algorithm
   */
  match(
    applications: MentorApplication[],
    mentorCapacities: Map<string, number>,
    studentData?: Map<string, { gpa: number; researchScore: number }>
  ): {
    matches: MatchingResult[]
    stats: MatchingStats
  } {
    // Initialize data structures
    this.initialize(applications, mentorCapacities)
    
    // Build preference lists
    this.buildStudentPreferences(applications)
    this.buildMentorPreferences(applications, studentData)
    
    // Run matching algorithm
    this.runMatching()
    
    // Return results
    return {
      matches: this.getMatches(),
      stats: this.getStats(applications.length)
    }
  }

  private initialize(
    applications: MentorApplication[],
    mentorCapacities: Map<string, number>
  ) {
    // Clear previous data
    this.studentPreferences.clear()
    this.mentorPreferences.clear()
    this.mentorCapacity.clear()
    this.mentorAccepted.clear()
    this.studentMatched.clear()
    this.matchRound.clear()

    // Initialize mentor capacities and accepted lists
    for (const [mentorId, capacity] of mentorCapacities) {
      this.mentorCapacity.set(mentorId, capacity)
      this.mentorAccepted.set(mentorId, new Set())
    }
  }

  private buildStudentPreferences(applications: MentorApplication[]) {
    for (const app of applications) {
      const preferences: string[] = []
      
      // Add choices in order
      preferences.push(app.firstChoiceId)
      if (app.secondChoiceId) preferences.push(app.secondChoiceId)
      if (app.thirdChoiceId) preferences.push(app.thirdChoiceId)
      
      this.studentPreferences.set(app.studentId, preferences)
    }
  }

  private buildMentorPreferences(
    applications: MentorApplication[],
    studentData?: Map<string, { gpa: number; researchScore: number }>
  ) {
    // Group applications by mentor
    const mentorApplications = new Map<string, MentorApplication[]>()
    
    for (const app of applications) {
      // First choice
      if (!mentorApplications.has(app.firstChoiceId)) {
        mentorApplications.set(app.firstChoiceId, [])
      }
      mentorApplications.get(app.firstChoiceId)!.push(app)
      
      // Second choice
      if (app.secondChoiceId) {
        if (!mentorApplications.has(app.secondChoiceId)) {
          mentorApplications.set(app.secondChoiceId, [])
        }
        mentorApplications.get(app.secondChoiceId)!.push(app)
      }
      
      // Third choice
      if (app.thirdChoiceId) {
        if (!mentorApplications.has(app.thirdChoiceId)) {
          mentorApplications.set(app.thirdChoiceId, [])
        }
        mentorApplications.get(app.thirdChoiceId)!.push(app)
      }
    }
    
    // Rank students for each mentor
    for (const [mentorId, apps] of mentorApplications) {
      const rankedStudents = this.rankStudentsForMentor(apps, studentData)
      this.mentorPreferences.set(mentorId, rankedStudents)
    }
  }

  private rankStudentsForMentor(
    applications: MentorApplication[],
    studentData?: Map<string, { gpa: number; researchScore: number }>
  ): string[] {
    // Score each student
    const scores = applications.map(app => {
      let score = 0
      
      // Base score from application quality
      score += app.personalStatement.length > 200 ? 10 : 5
      score += app.researchInterest.length > 100 ? 10 : 5
      
      // Choice preference (mentor prefers students who rank them higher)
      if (app.firstChoiceId === applications[0].firstChoiceId) score += 30
      else if (app.secondChoiceId === applications[0].firstChoiceId) score += 20
      else if (app.thirdChoiceId === applications[0].firstChoiceId) score += 10
      
      // Academic performance
      if (studentData?.has(app.studentId)) {
        const data = studentData.get(app.studentId)!
        score += data.gpa * 10 // GPA weight
        score += data.researchScore * 5 // Research score weight
      }
      
      return {
        studentId: app.studentId,
        score
      }
    })
    
    // Sort by score (descending) and return student IDs
    return scores
      .sort((a, b) => b.score - a.score)
      .map(s => s.studentId)
  }

  private runMatching() {
    // Track unmatched students for each round
    let unmatchedStudents = new Set(this.studentPreferences.keys())
    
    // Run up to 3 rounds (for 3 choices)
    for (let round = 1; round <= 3; round++) {
      const thisRoundUnmatched = new Set<string>()
      
      // Each unmatched student proposes to their next choice
      for (const studentId of unmatchedStudents) {
        const preferences = this.studentPreferences.get(studentId)!
        
        // Check if student has a preference for this round
        if (preferences.length >= round) {
          const mentorId = preferences[round - 1]
          
          // Propose to mentor
          if (this.proposeToMentor(studentId, mentorId)) {
            this.studentMatched.set(studentId, mentorId)
            this.matchRound.set(studentId, round)
          } else {
            thisRoundUnmatched.add(studentId)
          }
        } else {
          // No more preferences
          thisRoundUnmatched.add(studentId)
        }
      }
      
      unmatchedStudents = thisRoundUnmatched
    }
  }

  private proposeToMentor(studentId: string, mentorId: string): boolean {
    const capacity = this.mentorCapacity.get(mentorId) || 0
    const accepted = this.mentorAccepted.get(mentorId) || new Set()
    const preferences = this.mentorPreferences.get(mentorId) || []
    
    // If mentor has capacity, accept
    if (accepted.size < capacity) {
      accepted.add(studentId)
      return true
    }
    
    // If at capacity, check if this student is preferred over current students
    const currentStudents = Array.from(accepted)
    const allStudents = [...currentStudents, studentId]
    
    // Rank all students according to mentor's preferences
    const rankedStudents = allStudents.sort((a, b) => {
      const aIndex = preferences.indexOf(a)
      const bIndex = preferences.indexOf(b)
      
      // If not in preference list, put at end
      const aRank = aIndex === -1 ? preferences.length : aIndex
      const bRank = bIndex === -1 ? preferences.length : bIndex
      
      return aRank - bRank
    })
    
    // Take top students up to capacity
    const newAccepted = new Set(rankedStudents.slice(0, capacity))
    
    // Check if student made it
    if (newAccepted.has(studentId)) {
      // Find who was displaced
      for (const oldStudent of accepted) {
        if (!newAccepted.has(oldStudent)) {
          // Remove old student's match
          this.studentMatched.delete(oldStudent)
          this.matchRound.delete(oldStudent)
        }
      }
      
      this.mentorAccepted.set(mentorId, newAccepted)
      return true
    }
    
    return false
  }

  private getMatches(): MatchingResult[] {
    const matches: MatchingResult[] = []
    
    for (const [studentId, mentorId] of this.studentMatched) {
      matches.push({
        studentId,
        mentorId,
        matchRound: this.matchRound.get(studentId) || 0
      })
    }
    
    return matches
  }

  private getStats(totalStudents: number): MatchingStats {
    let firstChoiceMatches = 0
    let secondChoiceMatches = 0
    let thirdChoiceMatches = 0
    
    for (const [_, round] of this.matchRound) {
      switch (round) {
        case 1:
          firstChoiceMatches++
          break
        case 2:
          secondChoiceMatches++
          break
        case 3:
          thirdChoiceMatches++
          break
      }
    }
    
    const matchedStudents = this.studentMatched.size
    
    return {
      totalStudents,
      matchedStudents,
      firstChoiceMatches,
      secondChoiceMatches,
      thirdChoiceMatches,
      unmatchedStudents: totalStudents - matchedStudents
    }
  }

  /**
   * Utility method to check if matching is stable
   */
  isStable(
    matches: MatchingResult[],
    applications: MentorApplication[]
  ): boolean {
    // Create quick lookup maps
    const studentMatch = new Map(matches.map(m => [m.studentId, m.mentorId]))
    const mentorStudents = new Map<string, Set<string>>()
    
    for (const match of matches) {
      if (!mentorStudents.has(match.mentorId)) {
        mentorStudents.set(match.mentorId, new Set())
      }
      mentorStudents.get(match.mentorId)!.add(match.studentId)
    }
    
    // Check for blocking pairs
    for (const app of applications) {
      const studentCurrentMentor = studentMatch.get(app.studentId)
      
      // Check each of student's preferences
      const preferences = [app.firstChoiceId, app.secondChoiceId, app.thirdChoiceId].filter(Boolean) as string[]
      
      for (const preferredMentor of preferences) {
        // If student prefers this mentor over current match
        if (!studentCurrentMentor || 
            preferences.indexOf(preferredMentor) < preferences.indexOf(studentCurrentMentor)) {
          
          // Check if mentor would prefer this student over current students
          const mentorCurrentStudents = mentorStudents.get(preferredMentor) || new Set()
          const mentorPrefs = this.mentorPreferences.get(preferredMentor) || []
          
          // Would mentor accept this student?
          if (mentorCurrentStudents.size < (this.mentorCapacity.get(preferredMentor) || 0)) {
            // Mentor has capacity - blocking pair found
            return false
          }
          
          // Check if student ranks higher than any current student
          for (const currentStudent of mentorCurrentStudents) {
            const studentRank = mentorPrefs.indexOf(app.studentId)
            const currentRank = mentorPrefs.indexOf(currentStudent)
            
            if (studentRank !== -1 && (currentRank === -1 || studentRank < currentRank)) {
              // Blocking pair found
              return false
            }
          }
        }
      }
    }
    
    return true
  }
}