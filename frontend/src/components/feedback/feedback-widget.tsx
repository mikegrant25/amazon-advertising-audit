'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react'

interface FeedbackWidgetProps {
  auditId?: string
  userId: string
}

export function FeedbackWidget({ auditId, userId }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    
    try {
      // In a real implementation, this would send to an API endpoint
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          type,
          auditId,
          userId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setIsSubmitted(false)
          setFeedback('')
          setType('general')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
        aria-label="Open feedback form"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Send Feedback
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close feedback form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isSubmitted ? (
        <div className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Thank you!</p>
          <p className="text-gray-600 mt-2">Your feedback helps us improve.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <select
              id="feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Report a Bug</option>
              <option value="feature">Feature Request</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="feedback-text" className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback
            </label>
            <textarea
              id="feedback-text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts, report issues, or suggest improvements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              As a pilot partner, your feedback is invaluable!
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}