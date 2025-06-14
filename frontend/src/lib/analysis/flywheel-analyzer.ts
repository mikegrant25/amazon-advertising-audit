import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { DataAggregator } from './data-aggregator'
import { MetricsCalculator } from './metrics-calculator'
import { 
  FlywheelMetrics, 
  FlywheelAnalysisResult,
  CalculationOptions,
  MetricDataPoint
} from './types'

export class FlywheelAnalyzer {
  private supabase: SupabaseClient<Database>
  private aggregator: DataAggregator
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.aggregator = new DataAggregator(supabase)
  }
  
  /**
   * Analyze an audit and generate flywheel metrics
   */
  async analyzeAudit(
    auditId: string, 
    options: CalculationOptions = {}
  ): Promise<FlywheelAnalysisResult> {
    const startTime = Date.now()
    
    try {
      // Get audit details
      const { data: audit, error: auditError } = await this.supabase
        .from('audits')
        .select('date_range_start, date_range_end, goal')
        .eq('id', auditId)
        .single()
      
      if (auditError || !audit) {
        throw new Error('Audit not found')
      }
      
      // Set default options
      const calcOptions = {
        minDataPoints: options.minDataPoints || 7,
        trendWindow: options.trendWindow || 30,
        confidenceThreshold: options.confidenceThreshold || 0.3,
        goalType: options.goalType || audit.goal
      }
      
      // Aggregate data from all reports
      const aggregatedData = await this.aggregator.aggregateDataForAudit(auditId)
      
      if (aggregatedData.length === 0) {
        throw new Error('No data found for analysis')
      }
      
      // Calculate metrics for each ASIN
      const asinMetrics = await Promise.all(
        aggregatedData.map(asinData => 
          this.calculateASINMetrics(asinData, calcOptions)
        )
      )
      
      // Filter out ASINs with insufficient data
      const validMetrics = asinMetrics.filter(m => m !== null) as FlywheelMetrics[]
      
      // Calculate summary metrics
      const totalRevenue = validMetrics.reduce((sum, m) => sum + m.totalRevenue, 0)
      const totalAdSpend = validMetrics.reduce((sum, m) => sum + m.adSpend, 0)
      const overallACoS = totalAdSpend > 0 ? (totalAdSpend / totalRevenue) * 100 : 0
      const overallROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0
      
      // Identify top opportunities
      const opportunities = validMetrics
        .filter(m => m.recommendedAction === 'reduce_spend')
        .sort((a, b) => {
          // Sort by potential savings
          const aSavings = a.adSpend * (a.recommendedSpendReduction || 0) / 100
          const bSavings = b.adSpend * (b.recommendedSpendReduction || 0) / 100
          return bSavings - aSavings
        })
        .slice(0, 10)
      
      // Calculate total potential savings
      const potentialSavings = opportunities.reduce((sum, m) => {
        return sum + (m.adSpend * (m.recommendedSpendReduction || 0) / 100)
      }, 0)
      
      const result: FlywheelAnalysisResult = {
        auditId,
        analyzedAt: new Date(),
        totalASINs: validMetrics.length,
        totalRevenue,
        totalAdSpend,
        overallACoS,
        overallROAS,
        asinMetrics: validMetrics,
        recommendations: {
          readyForReduction: opportunities.length,
          potentialSavings,
          topOpportunities: opportunities
        }
      }
      
      // Store results
      await this.storeAnalysisResults(result)
      
      // Log performance
      const processingTime = (Date.now() - startTime) / 1000
      console.log(`Flywheel analysis completed in ${processingTime}s for ${validMetrics.length} ASINs`)
      
      return result
      
    } catch (error) {
      console.error('Flywheel analysis error:', error)
      throw error
    }
  }
  
  /**
   * Calculate flywheel metrics for a single ASIN
   */
  private async calculateASINMetrics(
    asinData: any,
    options: CalculationOptions
  ): Promise<FlywheelMetrics | null> {
    // Check if we have enough data
    if (asinData.dailyMetrics.length < options.minDataPoints!) {
      return null
    }
    
    // Calculate total revenue (ad + organic)
    const totalRevenue = asinData.adMetrics.sales + asinData.organicMetrics.orderedProductSales
    if (totalRevenue === 0) return null
    
    // Calculate ad attribution percentage
    const adAttributionPercentage = MetricsCalculator.calculateAdAttribution(
      asinData.adMetrics.sales,
      totalRevenue
    )
    
    // Calculate standard metrics
    const standardMetrics = MetricsCalculator.calculateStandardMetrics({
      impressions: asinData.adMetrics.impressions,
      clicks: asinData.adMetrics.clicks,
      spend: asinData.adMetrics.spend,
      sales: asinData.adMetrics.sales,
      orders: asinData.adMetrics.orders
    })
    
    // Calculate conversion rates
    const adConversionRate = asinData.adMetrics.clicks > 0
      ? (asinData.adMetrics.orders / asinData.adMetrics.clicks) * 100
      : 0
    
    // Prepare time series for trend analysis
    const recentData = asinData.dailyMetrics.slice(-options.trendWindow!)
    const adAttributionTimeSeries: MetricDataPoint[] = recentData
      .map((d: any) => {
        const dailyTotal = d.adSales + d.organicSales
        return {
          date: d.date,
          value: dailyTotal > 0 ? (d.adSales / dailyTotal) * 100 : 0
        }
      })
      .filter((d: MetricDataPoint) => d.value > 0)
    
    // Calculate trend
    const trendAnalysis = MetricsCalculator.calculateTrend(adAttributionTimeSeries)
    
    // Calculate flywheel score
    const flywheelScore = MetricsCalculator.calculateFlywheelScore({
      adAttributionPercentage,
      adAttributionTrend: trendAnalysis.trend,
      conversionRate: adConversionRate,
      organicConversionRate: asinData.organicMetrics.conversionRate,
      roas: standardMetrics.roas,
      trendConfidence: trendAnalysis.confidence
    })
    
    // Generate recommendation
    const recommendation = MetricsCalculator.generateRecommendation({
      flywheelScore,
      adAttributionPercentage,
      adAttributionTrend: trendAnalysis.trend,
      acos: standardMetrics.acos,
      roas: standardMetrics.roas,
      dataPoints: asinData.dailyMetrics.length
    })
    
    // Get date range from daily metrics
    const dateRange = {
      start: asinData.dailyMetrics[0].date,
      end: asinData.dailyMetrics[asinData.dailyMetrics.length - 1].date
    }
    
    return {
      asin: asinData.asin,
      productTitle: asinData.productTitle,
      dateRange,
      totalRevenue,
      adAttributedRevenue: asinData.adMetrics.sales,
      organicRevenue: asinData.organicMetrics.orderedProductSales,
      adAttributionPercentage,
      totalUnits: asinData.adMetrics.units + asinData.organicMetrics.unitsOrdered,
      adAttributedUnits: asinData.adMetrics.units,
      organicUnits: asinData.organicMetrics.unitsOrdered,
      adSpend: asinData.adMetrics.spend,
      impressions: asinData.adMetrics.impressions,
      clicks: asinData.adMetrics.clicks,
      acos: standardMetrics.acos,
      roas: standardMetrics.roas,
      conversionRate: adConversionRate,
      organicConversionRate: asinData.organicMetrics.conversionRate,
      flywheelScore,
      flywheelTrend: trendAnalysis.trend,
      recommendedAction: recommendation.action,
      recommendedSpendReduction: recommendation.spendReduction,
      confidenceLevel: recommendation.confidence
    }
  }
  
  /**
   * Store analysis results in the database
   */
  private async storeAnalysisResults(result: FlywheelAnalysisResult): Promise<void> {
    try {
      // Update audit status
      await this.supabase
        .from('audits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          analysis_result: {
            summary: {
              totalASINs: result.totalASINs,
              totalRevenue: result.totalRevenue,
              totalAdSpend: result.totalAdSpend,
              overallACoS: result.overallACoS,
              overallROAS: result.overallROAS,
              readyForReduction: result.recommendations.readyForReduction,
              potentialSavings: result.recommendations.potentialSavings
            },
            topOpportunities: result.recommendations.topOpportunities.map(opp => ({
              asin: opp.asin,
              productTitle: opp.productTitle,
              flywheelScore: opp.flywheelScore,
              recommendedSpendReduction: opp.recommendedSpendReduction,
              currentSpend: opp.adSpend,
              potentialSavings: opp.adSpend * (opp.recommendedSpendReduction || 0) / 100
            }))
          }
        })
        .eq('id', result.auditId)
      
      // Store detailed ASIN metrics (top 100 for now)
      const topMetrics = result.asinMetrics
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 100)
      
      const metricsRecords = topMetrics.map(metric => ({
        audit_id: result.auditId,
        asin: metric.asin,
        metrics: metric,
        created_at: new Date().toISOString()
      }))
      
      // Store in a new asin_metrics table (would need migration)
      // For now, we'll store in the audit's analysis_result field
      
    } catch (error) {
      console.error('Failed to store analysis results:', error)
      // Don't throw - analysis is complete even if storage fails
    }
  }
}