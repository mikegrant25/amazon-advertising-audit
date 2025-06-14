export type RecommendationType = 'quick_win' | 'strategic' | 'defensive' | 'growth'
export type ImpactLevel = 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Recommendation {
  id: string
  title: string
  description: string
  type: RecommendationType
  impact: ImpactLevel
  confidence: ConfidenceLevel
  priority: number
  action_items: string[]
  estimated_savings?: number
  affected_entity?: string
  metric_impact?: {
    metric: string
    current_value: number
    projected_value: number
    improvement_percentage: number
  }
  implementation_time?: string
  category?: string
}