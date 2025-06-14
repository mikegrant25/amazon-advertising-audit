// Analytics tracking for pilot program metrics

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

// Track key user actions for pilot analysis
export const analytics = {
  // Core workflow events
  track: (event: AnalyticsEvent) => {
    // Vercel Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.name, event.properties)
    }

    // Custom pilot tracking (could send to your own analytics endpoint)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.name,
          properties: event.properties,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer
        })
      }).catch(console.error)
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event.name, event.properties)
    }
  },

  // Predefined events for consistency
  events: {
    // Onboarding
    PILOT_SIGNUP: 'pilot_signup',
    FIRST_LOGIN: 'first_login',
    ONBOARDING_COMPLETE: 'onboarding_complete',

    // Audit workflow
    AUDIT_CREATED: 'audit_created',
    FILE_UPLOADED: 'file_uploaded',
    GOAL_SELECTED: 'goal_selected',
    ANALYSIS_STARTED: 'analysis_started',
    ANALYSIS_COMPLETED: 'analysis_completed',
    RECOMMENDATIONS_VIEWED: 'recommendations_viewed',
    PDF_DOWNLOADED: 'pdf_downloaded',

    // Engagement
    RECOMMENDATION_CLICKED: 'recommendation_clicked',
    FEEDBACK_SUBMITTED: 'feedback_submitted',
    HELP_ACCESSED: 'help_accessed',
    
    // Errors
    FILE_UPLOAD_ERROR: 'file_upload_error',
    ANALYSIS_ERROR: 'analysis_error',
    PDF_GENERATION_ERROR: 'pdf_generation_error'
  },

  // Helper methods for common tracking scenarios
  trackAuditCreated: (auditId: string, auditName: string) => {
    analytics.track({
      name: analytics.events.AUDIT_CREATED,
      properties: { auditId, auditName }
    })
  },

  trackGoalSelected: (goal: string, auditId: string) => {
    analytics.track({
      name: analytics.events.GOAL_SELECTED,
      properties: { goal, auditId }
    })
  },

  trackAnalysisCompleted: (auditId: string, duration: number, metrics: any) => {
    analytics.track({
      name: analytics.events.ANALYSIS_COMPLETED,
      properties: {
        auditId,
        duration,
        totalASINs: metrics.totalASINs,
        totalRevenue: metrics.totalRevenue,
        recommendationCount: metrics.recommendationCount
      }
    })
  },

  trackPDFDownloaded: (auditId: string, fileSize?: number) => {
    analytics.track({
      name: analytics.events.PDF_DOWNLOADED,
      properties: { auditId, fileSize }
    })
  },

  trackError: (errorType: string, errorMessage: string, context?: any) => {
    analytics.track({
      name: errorType,
      properties: {
        error: errorMessage,
        ...context
      }
    })
  }
}

// Usage analytics for pilot metrics
export const usageMetrics = {
  // Time tracking
  startTimer: (key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`timer_${key}`, Date.now().toString())
    }
  },

  endTimer: (key: string): number => {
    if (typeof window !== 'undefined') {
      const start = sessionStorage.getItem(`timer_${key}`)
      if (start) {
        const duration = Date.now() - parseInt(start)
        sessionStorage.removeItem(`timer_${key}`)
        return duration
      }
    }
    return 0
  },

  // Session tracking
  incrementSessionCount: (key: string) => {
    if (typeof window !== 'undefined') {
      const current = parseInt(sessionStorage.getItem(`count_${key}`) || '0')
      sessionStorage.setItem(`count_${key}`, (current + 1).toString())
    }
  },

  getSessionCount: (key: string): number => {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem(`count_${key}`) || '0')
    }
    return 0
  }
}

// Pilot-specific metrics
export const pilotMetrics = {
  trackFirstAudit: () => {
    const isFirstAudit = !localStorage.getItem('first_audit_completed')
    if (isFirstAudit) {
      analytics.track({
        name: 'pilot_first_audit_completed',
        properties: {
          timeToFirstAudit: Date.now() - parseInt(localStorage.getItem('pilot_start_time') || Date.now().toString())
        }
      })
      localStorage.setItem('first_audit_completed', 'true')
    }
  },

  recordPilotStart: () => {
    if (!localStorage.getItem('pilot_start_time')) {
      localStorage.setItem('pilot_start_time', Date.now().toString())
    }
  }
}