interface WorkflowTiming {
  startTime: number
  steps: Record<string, { start: number; end?: number }>
  totalTime?: number
}

export class WorkflowTimer {
  private timing: WorkflowTiming

  constructor() {
    this.timing = {
      startTime: Date.now(),
      steps: {}
    }
  }

  startStep(stepName: string) {
    this.timing.steps[stepName] = {
      start: Date.now()
    }
  }

  endStep(stepName: string) {
    if (this.timing.steps[stepName]) {
      this.timing.steps[stepName].end = Date.now()
    }
  }

  getStepDuration(stepName: string): number | null {
    const step = this.timing.steps[stepName]
    if (!step || !step.end) return null
    return Math.round((step.end - step.start) / 1000) // Return in seconds
  }

  getTotalDuration(): number {
    return Math.round((Date.now() - this.timing.startTime) / 1000) // Return in seconds
  }

  getTimingReport(): {
    totalTime: number
    steps: Record<string, number>
  } {
    const steps: Record<string, number> = {}
    
    Object.entries(this.timing.steps).forEach(([name, timing]) => {
      if (timing.end) {
        steps[name] = Math.round((timing.end - timing.start) / 1000)
      }
    })

    return {
      totalTime: this.getTotalDuration(),
      steps
    }
  }

  // Store timing in session storage for persistence across pages
  persist(auditId: string) {
    const report = this.getTimingReport()
    sessionStorage.setItem(`audit-timing-${auditId}`, JSON.stringify(report))
  }

  static retrieve(auditId: string): { totalTime: number; steps: Record<string, number> } | null {
    const stored = sessionStorage.getItem(`audit-timing-${auditId}`)
    if (!stored) return null
    
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  static clear(auditId: string) {
    sessionStorage.removeItem(`audit-timing-${auditId}`)
  }
}