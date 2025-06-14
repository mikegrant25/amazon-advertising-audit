import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { PerformanceMetricsCalculator } from './performance-metrics'

interface CampaignData {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  cost: number
  sales: number
  orders: number
}

interface AdGroupData extends CampaignData {
  adGroupId: string
  adGroupName: string
}

export class PerformanceAggregator {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Aggregate campaign performance data from parsed CSV data
   */
  async aggregateCampaignData(auditId: string): Promise<CampaignData[]> {
    // Get all processed files for this audit
    const { data: files, error: filesError } = await this.supabase
      .from('audit_files')
      .select('id, file_type, parsed_data')
      .eq('audit_id', auditId)
      .eq('status', 'completed')
      .in('file_type', ['sponsored_products', 'sponsored_brands', 'sponsored_display'])

    if (filesError) throw filesError
    if (!files || files.length === 0) {
      throw new Error('No processed advertising files found')
    }

    const campaignMap = new Map<string, CampaignData>()

    // Process each file's data
    for (const file of files) {
      if (!file.parsed_data || typeof file.parsed_data !== 'object') continue

      const data = file.parsed_data as any
      if (!Array.isArray(data.rows)) continue

      // Aggregate by campaign
      for (const row of data.rows) {
        const campaignName = row['Campaign Name'] || row['campaign_name'] || ''
        const campaignId = row['Campaign Id'] || row['campaign_id'] || campaignName

        if (!campaignName) continue

        const existing = campaignMap.get(campaignId) || {
          campaignId,
          campaignName,
          impressions: 0,
          clicks: 0,
          cost: 0,
          sales: 0,
          orders: 0,
        }

        // Aggregate metrics (handle different column name variations)
        existing.impressions += this.parseNumber(row['Impressions'] || row['impressions'] || 0)
        existing.clicks += this.parseNumber(row['Clicks'] || row['clicks'] || 0)
        existing.cost += this.parseNumber(row['Spend'] || row['Cost'] || row['spend'] || row['cost'] || 0)
        existing.sales += this.parseNumber(
          row['7 Day Total Sales'] || 
          row['14 Day Total Sales'] || 
          row['Sales'] || 
          row['sales'] || 
          row['total_sales'] || 
          0
        )
        existing.orders += this.parseNumber(
          row['7 Day Total Orders (#)'] || 
          row['14 Day Total Orders (#)'] || 
          row['Orders'] || 
          row['orders'] || 
          row['total_orders'] || 
          0
        )

        campaignMap.set(campaignId, existing)
      }
    }

    return Array.from(campaignMap.values())
  }

  /**
   * Aggregate ad group performance data from parsed CSV data
   */
  async aggregateAdGroupData(auditId: string): Promise<AdGroupData[]> {
    const { data: files, error: filesError } = await this.supabase
      .from('audit_files')
      .select('id, file_type, parsed_data')
      .eq('audit_id', auditId)
      .eq('status', 'completed')
      .in('file_type', ['sponsored_products', 'sponsored_brands', 'sponsored_display'])

    if (filesError) throw filesError
    if (!files || files.length === 0) {
      throw new Error('No processed advertising files found')
    }

    const adGroupMap = new Map<string, AdGroupData>()

    // Process each file's data
    for (const file of files) {
      if (!file.parsed_data || typeof file.parsed_data !== 'object') continue

      const data = file.parsed_data as any
      if (!Array.isArray(data.rows)) continue

      // Aggregate by ad group
      for (const row of data.rows) {
        const adGroupName = row['Ad Group Name'] || row['ad_group_name'] || ''
        const adGroupId = row['Ad Group Id'] || row['ad_group_id'] || adGroupName
        
        // Skip if no ad group info
        if (!adGroupName) continue

        const campaignName = row['Campaign Name'] || row['campaign_name'] || ''
        const campaignId = row['Campaign Id'] || row['campaign_id'] || campaignName

        const key = `${campaignId}_${adGroupId}`
        const existing = adGroupMap.get(key) || {
          campaignId,
          campaignName,
          adGroupId,
          adGroupName,
          impressions: 0,
          clicks: 0,
          cost: 0,
          sales: 0,
          orders: 0,
        }

        // Aggregate metrics
        existing.impressions += this.parseNumber(row['Impressions'] || row['impressions'] || 0)
        existing.clicks += this.parseNumber(row['Clicks'] || row['clicks'] || 0)
        existing.cost += this.parseNumber(row['Spend'] || row['Cost'] || row['spend'] || row['cost'] || 0)
        existing.sales += this.parseNumber(
          row['7 Day Total Sales'] || 
          row['14 Day Total Sales'] || 
          row['Sales'] || 
          row['sales'] || 
          row['total_sales'] || 
          0
        )
        existing.orders += this.parseNumber(
          row['7 Day Total Orders (#)'] || 
          row['14 Day Total Orders (#)'] || 
          row['Orders'] || 
          row['orders'] || 
          row['total_orders'] || 
          0
        )

        adGroupMap.set(key, existing)
      }
    }

    return Array.from(adGroupMap.values())
  }

  /**
   * Get total organic sales from business report
   */
  async getOrganicSales(auditId: string): Promise<number | undefined> {
    const { data: businessReport, error } = await this.supabase
      .from('audit_files')
      .select('parsed_data')
      .eq('audit_id', auditId)
      .eq('file_type', 'business_report')
      .eq('status', 'completed')
      .single()

    if (error || !businessReport?.parsed_data) {
      // No business report available
      return undefined
    }

    const data = businessReport.parsed_data as any
    if (!Array.isArray(data.rows)) return undefined

    let totalSales = 0
    let totalUnitsOrdered = 0

    for (const row of data.rows) {
      // Try to get ordered product sales
      const orderedProductSales = this.parseNumber(
        row['Ordered Product Sales'] || 
        row['ordered_product_sales'] || 
        0
      )
      
      totalSales += orderedProductSales

      // Also track units for validation
      totalUnitsOrdered += this.parseNumber(
        row['Units Ordered'] || 
        row['units_ordered'] || 
        0
      )
    }

    // Return organic sales (this would need adjustment based on how you calculate organic vs paid)
    // For now, returning total sales from business report
    return totalSales
  }

  /**
   * Perform complete performance analysis for an audit
   */
  async analyzePerformance(auditId: string) {
    // Get campaign data
    const campaignData = await this.aggregateCampaignData(auditId)
    
    // Get ad group data
    const adGroupData = await this.aggregateAdGroupData(auditId)
    
    // Get organic sales if available
    const organicSales = await this.getOrganicSales(auditId)

    // Calculate all metrics
    const analysis = PerformanceMetricsCalculator.analyzePerformance(
      campaignData,
      adGroupData,
      organicSales
    )

    // Store results in database
    const { error: updateError } = await this.supabase
      .from('audits')
      .update({
        performance_metrics: analysis as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auditId)

    if (updateError) throw updateError

    return analysis
  }

  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '').trim()
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
}