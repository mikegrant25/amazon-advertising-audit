export interface FlywheelMetrics {
  asin: string
  productTitle?: string
  dateRange: {
    start: Date
    end: Date
  }
  
  // Revenue metrics
  totalRevenue: number
  adAttributedRevenue: number
  organicRevenue: number
  adAttributionPercentage: number
  
  // Volume metrics
  totalUnits: number
  adAttributedUnits: number
  organicUnits: number
  
  // Advertising metrics
  adSpend: number
  impressions: number
  clicks: number
  acos: number
  roas: number
  
  // Conversion metrics
  conversionRate: number
  organicConversionRate: number
  
  // Flywheel score (0-100)
  flywheelScore: number
  flywheelTrend: 'increasing' | 'stable' | 'decreasing'
  
  // Recommendations
  recommendedAction: 'maintain' | 'reduce_spend' | 'increase_spend' | 'pause'
  recommendedSpendReduction?: number // Percentage reduction suggested
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface FlywheelAnalysisResult {
  auditId: string
  analyzedAt: Date
  totalASINs: number
  
  // Summary metrics
  totalRevenue: number
  totalAdSpend: number
  overallACoS: number
  overallROAS: number
  
  // ASIN-level results
  asinMetrics: FlywheelMetrics[]
  
  // Recommendations summary
  recommendations: {
    readyForReduction: number // Count of ASINs
    potentialSavings: number // Dollar amount
    topOpportunities: FlywheelMetrics[] // Top 10 ASINs by savings potential
  }
}

export interface CalculationOptions {
  minDataPoints?: number // Minimum days of data required
  trendWindow?: number // Days to look back for trend analysis
  confidenceThreshold?: number // Minimum confidence for recommendations
  goalType?: 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'
}

// Time series data point for trend analysis
export interface MetricDataPoint {
  date: Date
  value: number
}

// Aggregated data from different report types
export interface AggregatedASINData {
  asin: string
  productTitle?: string
  
  // From Sponsored Products/Brands/Display
  adMetrics: {
    impressions: number
    clicks: number
    spend: number
    sales: number
    orders: number
    units: number
  }
  
  // From Business Report
  organicMetrics: {
    sessions: number
    pageViews: number
    unitsOrdered: number
    orderedProductSales: number
    conversionRate: number
  }
  
  // Time series for trend analysis
  dailyMetrics: {
    date: Date
    adSales: number
    organicSales: number
    adSpend: number
    sessions: number
  }[]
}

export interface StandardMetrics {
  acos: number // Ad Cost of Sales
  roas: number // Return on Ad Spend
  ctr: number // Click-Through Rate
  cvr: number // Conversion Rate
  cpc: number // Cost Per Click
}

export interface CampaignMetrics extends StandardMetrics {
  campaignName: string
  impressions: number
  clicks: number
  spend: number
  sales: number
  orders: number
}