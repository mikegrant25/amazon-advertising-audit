export interface Audit {
  id: string
  user_id: string
  name: string
  description?: string
  goal?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  analysis_result?: any
  recommendations?: any
  recommendations_generated_at?: string
  created_at: string
  updated_at: string
  audit_files?: AuditFile[]
}

export interface AuditFile {
  id: string
  audit_id: string
  file_type: string
  file_name: string
  file_path: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'warning' | 'error'
  processing_started_at?: string
  processing_completed_at?: string
  parsed_data?: any
  error_message?: string
  created_at: string
  updated_at: string
}

export interface FlywheelAnalysis {
  score: number
  summary: {
    total_asins: number
    ad_dependent_percentage: number
    avg_ad_spend_per_asin: number
    avg_organic_revenue_per_asin: number
  }
  asins: Array<{
    asin: string
    total_ad_spend: number
    total_organic_revenue: number
    flywheel_metrics: {
      is_ad_dependent: boolean
      ad_attribution_percentage: number
    }
  }>
}

export interface PerformanceMetrics {
  summary: {
    overall_acos: number
    ctr: number
    cvr: number
    roas: number
  }
  top_performers: Array<{
    name: string
    acos: number
    roas: number
    spend: number
  }>
  bottom_performers: Array<{
    name: string
    acos: number
    roas: number
    spend: number
  }>
}