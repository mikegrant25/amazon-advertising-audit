import { 
  StandardMetrics, 
  CampaignMetrics,
  AggregatedASINData,
  FlywheelMetrics,
  MetricDataPoint
} from './types'

export class MetricsCalculator {
  /**
   * Calculate standard advertising metrics
   */
  static calculateStandardMetrics(data: {
    impressions: number
    clicks: number
    spend: number
    sales: number
    orders: number
  }): StandardMetrics {
    // Prevent division by zero
    const safeDivide = (numerator: number, denominator: number): number => {
      return denominator === 0 ? 0 : numerator / denominator
    }
    
    return {
      acos: safeDivide(data.spend, data.sales) * 100,
      roas: safeDivide(data.sales, data.spend),
      ctr: safeDivide(data.clicks, data.impressions) * 100,
      cvr: safeDivide(data.orders, data.clicks) * 100,
      cpc: safeDivide(data.spend, data.clicks)
    }
  }
  
  /**
   * Calculate ad attribution percentage
   * Core metric for flywheel analysis
   */
  static calculateAdAttribution(adRevenue: number, totalRevenue: number): number {
    if (totalRevenue === 0) return 0
    return (adRevenue / totalRevenue) * 100
  }
  
  /**
   * Calculate organic revenue
   * Total revenue - Ad attributed revenue
   */
  static calculateOrganicRevenue(totalRevenue: number, adRevenue: number): number {
    return Math.max(0, totalRevenue - adRevenue)
  }
  
  /**
   * Calculate trend from time series data
   * Uses linear regression to determine if metric is increasing/decreasing
   */
  static calculateTrend(dataPoints: MetricDataPoint[]): {
    trend: 'increasing' | 'stable' | 'decreasing'
    slope: number
    confidence: number
  } {
    if (dataPoints.length < 3) {
      return { trend: 'stable', slope: 0, confidence: 0 }
    }
    
    // Convert dates to numeric values (days from first date)
    const firstDate = dataPoints[0].date.getTime()
    const points = dataPoints.map(dp => ({
      x: (dp.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
      y: dp.value
    }))
    
    // Calculate linear regression
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)
    const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate R-squared for confidence
    const yMean = sumY / n
    const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
    const ssResidual = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept
      return sum + Math.pow(p.y - predicted, 2)
    }, 0)
    const rSquared = 1 - (ssResidual / ssTotal)
    
    // Determine trend based on slope and significance
    const slopePercentage = (slope / yMean) * 100 // Daily percentage change
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    
    if (Math.abs(slopePercentage) > 1 && rSquared > 0.3) {
      trend = slopePercentage > 0 ? 'increasing' : 'decreasing'
    }
    
    return {
      trend,
      slope: slopePercentage,
      confidence: rSquared
    }
  }
  
  /**
   * Calculate flywheel score (0-100)
   * Higher score = product is gaining organic momentum
   */
  static calculateFlywheelScore(data: {
    adAttributionPercentage: number
    adAttributionTrend: 'increasing' | 'stable' | 'decreasing'
    conversionRate: number
    organicConversionRate: number
    roas: number
    trendConfidence: number
  }): number {
    let score = 0
    
    // Base score from ad attribution percentage (inverted - lower is better)
    // 0% ad attribution = 40 points, 100% = 0 points
    score += Math.max(0, 40 - (data.adAttributionPercentage * 0.4))
    
    // Trend bonus/penalty (up to 30 points)
    if (data.adAttributionTrend === 'decreasing') {
      score += 30 * data.trendConfidence // Decreasing ad dependency is good
    } else if (data.adAttributionTrend === 'increasing') {
      score -= 15 * data.trendConfidence // Increasing ad dependency is bad
    }
    
    // Organic conversion rate comparison (up to 20 points)
    if (data.conversionRate > 0) {
      const conversionRatio = data.organicConversionRate / data.conversionRate
      score += Math.min(20, conversionRatio * 20)
    }
    
    // ROAS bonus (up to 10 points)
    if (data.roas > 4) {
      score += Math.min(10, (data.roas - 4) * 2.5)
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score))
  }
  
  /**
   * Generate spend reduction recommendation
   */
  static generateRecommendation(metrics: {
    flywheelScore: number
    adAttributionPercentage: number
    adAttributionTrend: 'increasing' | 'stable' | 'decreasing'
    acos: number
    roas: number
    dataPoints: number
  }): {
    action: 'maintain' | 'reduce_spend' | 'increase_spend' | 'pause'
    spendReduction?: number
    confidence: 'high' | 'medium' | 'low'
    reasoning: string[]
  } {
    const reasoning: string[] = []
    let action: 'maintain' | 'reduce_spend' | 'increase_spend' | 'pause' = 'maintain'
    let spendReduction: number | undefined
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    
    // Determine confidence based on data points
    if (metrics.dataPoints < 7) {
      confidence = 'low'
      reasoning.push('Limited data available')
    } else if (metrics.dataPoints >= 30) {
      confidence = 'high'
    }
    
    // High flywheel score = ready for spend reduction
    if (metrics.flywheelScore >= 70) {
      action = 'reduce_spend'
      spendReduction = 25 // Start with 25% reduction
      reasoning.push('Strong organic momentum detected')
      
      if (metrics.flywheelScore >= 85) {
        spendReduction = 50 // More aggressive reduction
        reasoning.push('Excellent organic performance')
      }
      
      if (metrics.adAttributionTrend === 'decreasing') {
        reasoning.push('Ad dependency trending down')
      }
    }
    
    // Low flywheel score with poor metrics
    else if (metrics.flywheelScore < 30) {
      if (metrics.acos > 30 || metrics.roas < 2) {
        action = 'pause'
        reasoning.push('Poor advertising efficiency')
      } else {
        action = 'increase_spend'
        reasoning.push('Product needs advertising support')
      }
    }
    
    // Special cases
    if (metrics.adAttributionPercentage < 10 && metrics.flywheelScore > 50) {
      action = 'reduce_spend'
      spendReduction = Math.max(spendReduction || 0, 50)
      reasoning.push('Very low ad dependency')
    }
    
    if (metrics.acos > 50) {
      if (action === 'reduce_spend') {
        spendReduction = Math.max(spendReduction || 0, 75)
        reasoning.push('High ACoS justifies larger reduction')
      } else {
        action = 'pause'
        reasoning.push('Unsustainable ACoS')
      }
    }
    
    return {
      action,
      spendReduction,
      confidence,
      reasoning
    }
  }
  
  /**
   * Aggregate metrics by campaign
   */
  static aggregateByCampaign(
    data: Array<{
      campaignName: string
      impressions: number
      clicks: number
      spend: number
      sales: number
      orders: number
    }>
  ): CampaignMetrics[] {
    const campaignMap = new Map<string, typeof data[0]>()
    
    // Aggregate data by campaign
    data.forEach(row => {
      const existing = campaignMap.get(row.campaignName)
      if (existing) {
        existing.impressions += row.impressions
        existing.clicks += row.clicks
        existing.spend += row.spend
        existing.sales += row.sales
        existing.orders += row.orders
      } else {
        campaignMap.set(row.campaignName, { ...row })
      }
    })
    
    // Calculate metrics for each campaign
    return Array.from(campaignMap.values()).map(campaign => ({
      campaignName: campaign.campaignName,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      spend: campaign.spend,
      sales: campaign.sales,
      orders: campaign.orders,
      ...this.calculateStandardMetrics(campaign)
    }))
  }
}