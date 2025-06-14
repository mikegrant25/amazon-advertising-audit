// Import not needed - types defined inline

export interface CampaignMetrics {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  cost: number
  sales: number
  orders: number
  ctr: number // Click-Through Rate
  cvr: number // Conversion Rate
  acos: number // Advertising Cost of Sales
  roas: number // Return on Ad Spend
}

export interface AdGroupMetrics extends CampaignMetrics {
  adGroupId: string
  adGroupName: string
}

export interface AccountMetrics {
  totalImpressions: number
  totalClicks: number
  totalCost: number
  totalSales: number
  totalOrders: number
  avgCtr: number
  avgCvr: number
  overallAcos: number
  overallRoas: number
  tacos?: number // Total Advertising Cost of Sales (if organic sales data available)
}

export interface PerformanceAnalysis {
  accountMetrics: AccountMetrics
  campaignMetrics: CampaignMetrics[]
  adGroupMetrics: AdGroupMetrics[]
  topPerformers: {
    byCtr: CampaignMetrics[]
    byCvr: CampaignMetrics[]
    byRoas: CampaignMetrics[]
  }
  bottomPerformers: {
    byCtr: CampaignMetrics[]
    byCvr: CampaignMetrics[]
    byAcos: CampaignMetrics[]
  }
}

export class PerformanceMetricsCalculator {
  /**
   * Calculate Click-Through Rate (CTR)
   * CTR = (Clicks / Impressions) * 100
   */
  static calculateCTR(clicks: number, impressions: number): number {
    if (impressions === 0) return 0
    return (clicks / impressions) * 100
  }

  /**
   * Calculate Conversion Rate (CVR)
   * CVR = (Orders / Clicks) * 100
   */
  static calculateCVR(orders: number, clicks: number): number {
    if (clicks === 0) return 0
    return (orders / clicks) * 100
  }

  /**
   * Calculate Advertising Cost of Sales (ACoS)
   * ACoS = (Ad Spend / Ad Revenue) * 100
   */
  static calculateACoS(adSpend: number, adRevenue: number): number {
    if (adRevenue === 0) return adSpend > 0 ? 999 : 0 // Cap at 999% for display
    return (adSpend / adRevenue) * 100
  }

  /**
   * Calculate Return on Ad Spend (ROAS)
   * ROAS = Ad Revenue / Ad Spend
   */
  static calculateROAS(adRevenue: number, adSpend: number): number {
    if (adSpend === 0) return 0
    return adRevenue / adSpend
  }

  /**
   * Calculate Total Advertising Cost of Sales (TACoS)
   * TACoS = (Ad Spend / Total Sales) * 100
   */
  static calculateTACoS(adSpend: number, totalSales: number): number {
    if (totalSales === 0) return adSpend > 0 ? 999 : 0
    return (adSpend / totalSales) * 100
  }

  /**
   * Calculate metrics for a campaign
   */
  static calculateCampaignMetrics(data: {
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
    cost: number
    sales: number
    orders: number
  }): CampaignMetrics {
    return {
      ...data,
      ctr: this.calculateCTR(data.clicks, data.impressions),
      cvr: this.calculateCVR(data.orders, data.clicks),
      acos: this.calculateACoS(data.cost, data.sales),
      roas: this.calculateROAS(data.sales, data.cost),
    }
  }

  /**
   * Calculate metrics for an ad group
   */
  static calculateAdGroupMetrics(data: {
    campaignId: string
    campaignName: string
    adGroupId: string
    adGroupName: string
    impressions: number
    clicks: number
    cost: number
    sales: number
    orders: number
  }): AdGroupMetrics {
    const campaignMetrics = this.calculateCampaignMetrics({
      campaignId: data.campaignId,
      campaignName: data.campaignName,
      impressions: data.impressions,
      clicks: data.clicks,
      cost: data.cost,
      sales: data.sales,
      orders: data.orders,
    })

    return {
      ...campaignMetrics,
      adGroupId: data.adGroupId,
      adGroupName: data.adGroupName,
    }
  }

  /**
   * Calculate account-level metrics
   */
  static calculateAccountMetrics(
    campaigns: CampaignMetrics[],
    organicSales?: number
  ): AccountMetrics {
    const totals = campaigns.reduce(
      (acc, campaign) => ({
        impressions: acc.impressions + campaign.impressions,
        clicks: acc.clicks + campaign.clicks,
        cost: acc.cost + campaign.cost,
        sales: acc.sales + campaign.sales,
        orders: acc.orders + campaign.orders,
      }),
      { impressions: 0, clicks: 0, cost: 0, sales: 0, orders: 0 }
    )

    const accountMetrics: AccountMetrics = {
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalCost: totals.cost,
      totalSales: totals.sales,
      totalOrders: totals.orders,
      avgCtr: this.calculateCTR(totals.clicks, totals.impressions),
      avgCvr: this.calculateCVR(totals.orders, totals.clicks),
      overallAcos: this.calculateACoS(totals.cost, totals.sales),
      overallRoas: this.calculateROAS(totals.sales, totals.cost),
    }

    // Calculate TACoS if organic sales data is available
    if (organicSales !== undefined) {
      const totalSales = totals.sales + organicSales
      accountMetrics.tacos = this.calculateTACoS(totals.cost, totalSales)
    }

    return accountMetrics
  }

  /**
   * Identify top performers by metric
   */
  static identifyTopPerformers(
    campaigns: CampaignMetrics[],
    limit: number = 5
  ): PerformanceAnalysis['topPerformers'] {
    // Filter out campaigns with minimal data
    const validCampaigns = campaigns.filter(
      c => c.impressions >= 100 && c.clicks >= 1
    )

    return {
      byCtr: [...validCampaigns]
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, limit),
      byCvr: [...validCampaigns]
        .filter(c => c.clicks >= 10) // Need enough clicks for meaningful CVR
        .sort((a, b) => b.cvr - a.cvr)
        .slice(0, limit),
      byRoas: [...validCampaigns]
        .filter(c => c.cost > 0)
        .sort((a, b) => b.roas - a.roas)
        .slice(0, limit),
    }
  }

  /**
   * Identify bottom performers by metric
   */
  static identifyBottomPerformers(
    campaigns: CampaignMetrics[],
    limit: number = 5
  ): PerformanceAnalysis['bottomPerformers'] {
    // Filter out campaigns with minimal data
    const validCampaigns = campaigns.filter(
      c => c.impressions >= 100 && c.cost > 0
    )

    return {
      byCtr: [...validCampaigns]
        .sort((a, b) => a.ctr - b.ctr)
        .slice(0, limit),
      byCvr: [...validCampaigns]
        .filter(c => c.clicks >= 10)
        .sort((a, b) => a.cvr - b.cvr)
        .slice(0, limit),
      byAcos: [...validCampaigns]
        .filter(c => c.sales > 0)
        .sort((a, b) => b.acos - a.acos) // Higher ACoS is worse
        .slice(0, limit),
    }
  }

  /**
   * Perform complete performance analysis
   */
  static analyzePerformance(
    campaignData: Array<{
      campaignId: string
      campaignName: string
      impressions: number
      clicks: number
      cost: number
      sales: number
      orders: number
    }>,
    adGroupData?: Array<{
      campaignId: string
      campaignName: string
      adGroupId: string
      adGroupName: string
      impressions: number
      clicks: number
      cost: number
      sales: number
      orders: number
    }>,
    organicSales?: number
  ): PerformanceAnalysis {
    // Calculate campaign metrics
    const campaignMetrics = campaignData.map(data =>
      this.calculateCampaignMetrics(data)
    )

    // Calculate ad group metrics if provided
    const adGroupMetrics = adGroupData
      ? adGroupData.map(data => this.calculateAdGroupMetrics(data))
      : []

    // Calculate account-level metrics
    const accountMetrics = this.calculateAccountMetrics(
      campaignMetrics,
      organicSales
    )

    // Identify top and bottom performers
    const topPerformers = this.identifyTopPerformers(campaignMetrics)
    const bottomPerformers = this.identifyBottomPerformers(campaignMetrics)

    return {
      accountMetrics,
      campaignMetrics,
      adGroupMetrics,
      topPerformers,
      bottomPerformers,
    }
  }

  /**
   * Format metric for display
   */
  static formatMetric(value: number, type: 'percentage' | 'currency' | 'ratio'): string {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(2)}%`
      case 'currency':
        return `$${value.toFixed(2)}`
      case 'ratio':
        return value.toFixed(2)
      default:
        return value.toString()
    }
  }

  /**
   * Get performance rating based on benchmarks
   */
  static getPerformanceRating(metric: string, value: number): 'excellent' | 'good' | 'average' | 'poor' {
    const benchmarks = {
      ctr: { excellent: 0.5, good: 0.3, average: 0.1 },
      cvr: { excellent: 15, good: 10, average: 5 },
      acos: { excellent: 15, good: 25, average: 35 }, // Lower is better
      roas: { excellent: 4, good: 3, average: 2 },
    }

    const benchmark = benchmarks[metric as keyof typeof benchmarks]
    if (!benchmark) return 'average'

    if (metric === 'acos') {
      // For ACoS, lower is better
      if (value <= benchmark.excellent) return 'excellent'
      if (value <= benchmark.good) return 'good'
      if (value <= benchmark.average) return 'average'
      return 'poor'
    } else {
      // For other metrics, higher is better
      if (value >= benchmark.excellent) return 'excellent'
      if (value >= benchmark.good) return 'good'
      if (value >= benchmark.average) return 'average'
      return 'poor'
    }
  }
}