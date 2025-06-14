import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { AggregatedASINData, MetricDataPoint } from './types'

type ParsedDataRow = Database['public']['Tables']['parsed_data']['Row']

export class DataAggregator {
  private supabase: SupabaseClient<Database>
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }
  
  /**
   * Aggregate data from all report types for analysis
   */
  async aggregateDataForAudit(auditId: string): Promise<AggregatedASINData[]> {
    // Get all processed files for this audit
    const { data: files, error: filesError } = await this.supabase
      .from('audit_files')
      .select('id, file_type')
      .eq('audit_id', auditId)
      .eq('status', 'completed')
    
    if (filesError || !files) {
      throw new Error('Failed to fetch audit files')
    }
    
    // Group files by type
    const filesByType = files.reduce((acc, file) => {
      if (!acc[file.file_type]) acc[file.file_type] = []
      acc[file.file_type].push(file.id)
      return acc
    }, {} as Record<string, string[]>)
    
    // Fetch data from each report type
    const [adData, businessData] = await Promise.all([
      this.fetchAdData(filesByType),
      this.fetchBusinessReportData(filesByType.business_report || [])
    ])
    
    // Aggregate by ASIN
    return this.mergeDataByASIN(adData, businessData)
  }
  
  /**
   * Fetch and aggregate advertising data from all ad report types
   */
  private async fetchAdData(filesByType: Record<string, string[]>): Promise<Map<string, any>> {
    const asinMap = new Map<string, any>()
    
    // Combine all ad file IDs
    const adFileIds = [
      ...(filesByType.sponsored_products || []),
      ...(filesByType.sponsored_brands || []),
      ...(filesByType.sponsored_display || [])
    ]
    
    if (adFileIds.length === 0) return asinMap
    
    // Fetch all ad data
    const { data: adRows, error } = await this.supabase
      .from('parsed_data')
      .select('*')
      .in('file_id', adFileIds)
    
    if (error || !adRows) return asinMap
    
    // Process each row
    adRows.forEach((row) => {
      const data = row.data as any
      const asin = data['Advertised ASIN'] || data['ASIN']
      
      if (!asin) return
      
      const existing = asinMap.get(asin) || this.initializeASINData(asin)
      
      // Aggregate metrics
      existing.adMetrics.impressions += this.parseNumber(data['Impressions'])
      existing.adMetrics.clicks += this.parseNumber(data['Clicks'])
      existing.adMetrics.spend += this.parseNumber(data['Spend'])
      
      // Handle different attribution windows
      const sales = this.parseNumber(
        data['7 Day Total Sales'] || 
        data['14 Day Total Sales'] || 
        data['Sales'] || 0
      )
      const orders = this.parseNumber(
        data['7 Day Total Orders (#)'] || 
        data['14 Day Total Orders (#)'] || 
        data['Orders'] || 0
      )
      const units = this.parseNumber(
        data['7 Day Total Units (#)'] || 
        data['14 Day Total Units (#)'] || 
        data['Units'] || 0
      )
      
      existing.adMetrics.sales += sales
      existing.adMetrics.orders += orders
      existing.adMetrics.units += units
      
      // Add daily data point
      const date = this.parseDate(data['Date'])
      if (date) {
        existing.dailyMetrics.push({
          date,
          adSales: sales,
          organicSales: 0, // Will be filled from business report
          adSpend: this.parseNumber(data['Spend']),
          sessions: 0 // Will be filled from business report
        })
      }
      
      asinMap.set(asin, existing)
    })
    
    return asinMap
  }
  
  /**
   * Fetch business report data for organic metrics
   */
  private async fetchBusinessReportData(fileIds: string[]): Promise<Map<string, any>> {
    const asinMap = new Map<string, any>()
    
    if (fileIds.length === 0) return asinMap
    
    const { data: businessRows, error } = await this.supabase
      .from('parsed_data')
      .select('*')
      .in('file_id', fileIds)
    
    if (error || !businessRows) return asinMap
    
    businessRows.forEach((row) => {
      const data = row.data as any
      const asin = data['Child ASIN'] || data['ASIN']
      
      if (!asin) return
      
      const existing = asinMap.get(asin) || this.initializeASINData(asin)
      
      // Update product title if available
      if (data['Title']) {
        existing.productTitle = data['Title']
      }
      
      // Aggregate organic metrics
      existing.organicMetrics.sessions += this.parseNumber(data['Sessions'])
      existing.organicMetrics.pageViews += this.parseNumber(data['Page Views'])
      existing.organicMetrics.unitsOrdered += this.parseNumber(data['Units Ordered'])
      existing.organicMetrics.orderedProductSales += this.parseNumber(data['Ordered Product Sales'])
      
      // Calculate conversion rate
      const sessions = this.parseNumber(data['Sessions'])
      const units = this.parseNumber(data['Units Ordered'])
      if (sessions > 0) {
        existing.organicMetrics.conversionRate = (units / sessions) * 100
      }
      
      // Add to daily metrics
      const date = this.parseDate(data['Date'])
      if (date) {
        const dailyPoint = existing.dailyMetrics.find(
          (d: any) => d.date.getTime() === date.getTime()
        )
        
        if (dailyPoint) {
          dailyPoint.organicSales = this.parseNumber(data['Ordered Product Sales'])
          dailyPoint.sessions = this.parseNumber(data['Sessions'])
        } else {
          existing.dailyMetrics.push({
            date,
            adSales: 0,
            organicSales: this.parseNumber(data['Ordered Product Sales']),
            adSpend: 0,
            sessions: this.parseNumber(data['Sessions'])
          })
        }
      }
      
      asinMap.set(asin, existing)
    })
    
    return asinMap
  }
  
  /**
   * Merge ad data and business report data by ASIN
   */
  private mergeDataByASIN(
    adData: Map<string, any>,
    businessData: Map<string, any>
  ): AggregatedASINData[] {
    const mergedMap = new Map<string, AggregatedASINData>()
    
    // Start with ad data
    adData.forEach((data, asin) => {
      mergedMap.set(asin, data)
    })
    
    // Merge in business data
    businessData.forEach((bizData, asin) => {
      const existing = mergedMap.get(asin)
      
      if (existing) {
        // Merge the data
        existing.productTitle = bizData.productTitle || existing.productTitle
        existing.organicMetrics = bizData.organicMetrics
        
        // Merge daily metrics
        bizData.dailyMetrics.forEach((bizDaily: any) => {
          const existingDaily = existing.dailyMetrics.find(
            (d: any) => d.date.getTime() === bizDaily.date.getTime()
          )
          
          if (existingDaily) {
            existingDaily.organicSales = bizDaily.organicSales
            existingDaily.sessions = bizDaily.sessions
          } else {
            existing.dailyMetrics.push(bizDaily)
          }
        })
      } else {
        // No ad data for this ASIN, just use business data
        mergedMap.set(asin, bizData)
      }
    })
    
    // Sort daily metrics by date for each ASIN
    mergedMap.forEach(data => {
      data.dailyMetrics.sort((a, b) => a.date.getTime() - b.date.getTime())
    })
    
    return Array.from(mergedMap.values())
  }
  
  /**
   * Initialize empty ASIN data structure
   */
  private initializeASINData(asin: string): AggregatedASINData {
    return {
      asin,
      productTitle: undefined,
      adMetrics: {
        impressions: 0,
        clicks: 0,
        spend: 0,
        sales: 0,
        orders: 0,
        units: 0
      },
      organicMetrics: {
        sessions: 0,
        pageViews: 0,
        unitsOrdered: 0,
        orderedProductSales: 0,
        conversionRate: 0
      },
      dailyMetrics: []
    }
  }
  
  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value
    if (!value) return 0
    
    // Remove currency symbols, commas, and percentage signs
    const cleaned = String(value).replace(/[$,%]/g, '').trim()
    const parsed = parseFloat(cleaned)
    
    return isNaN(parsed) ? 0 : parsed
  }
  
  /**
   * Parse date from MM/DD/YYYY format
   */
  private parseDate(value: any): Date | null {
    if (!value) return null
    
    const parts = String(value).split('/')
    if (parts.length !== 3) return null
    
    const month = parseInt(parts[0], 10)
    const day = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null
    
    return new Date(year, month - 1, day)
  }
}