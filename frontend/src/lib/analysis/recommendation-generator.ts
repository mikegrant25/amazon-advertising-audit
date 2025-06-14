import { AuditGoal } from '@/components/audits/goal-selection'
import { FlywheelMetrics } from './types'

export interface GeneratedRecommendation {
  id: string
  category: 'flywheel' | 'efficiency' | 'growth' | 'defense' | 'portfolio'
  priority: number // 1-10, higher is more important
  title: string
  description: string
  impact: {
    metric: string
    current: string | number
    projected: string | number
    improvement: string
  }
  action: string
  estimatedValue: number // Monthly $ impact
  timeToImplement: string
  confidence: 'high' | 'medium' | 'low'
  context?: {
    asin?: string
    keyword?: string
    campaign?: string
    adGroup?: string
  }
}

// Goal-specific scoring weights
const goalScoringWeights: Record<AuditGoal, Record<string, number>> = {
  profitability: {
    costReduction: 2.0,
    efficiencyImprovement: 1.8,
    revenueGrowth: 0.8,
    marketDefense: 0.5,
    portfolioBalance: 1.0
  },
  growth: {
    costReduction: 0.8,
    efficiencyImprovement: 1.0,
    revenueGrowth: 2.0,
    marketDefense: 0.6,
    portfolioBalance: 1.2
  },
  launch: {
    costReduction: 0.6,
    efficiencyImprovement: 0.8,
    revenueGrowth: 1.8,
    marketDefense: 0.5,
    portfolioBalance: 0.8
  },
  defense: {
    costReduction: 1.0,
    efficiencyImprovement: 1.2,
    revenueGrowth: 0.8,
    marketDefense: 2.0,
    portfolioBalance: 1.0
  },
  portfolio: {
    costReduction: 1.2,
    efficiencyImprovement: 1.5,
    revenueGrowth: 1.3,
    marketDefense: 1.0,
    portfolioBalance: 2.0
  }
}

export class RecommendationGenerator {
  private goal: AuditGoal
  private recommendations: GeneratedRecommendation[] = []
  private idCounter = 0

  constructor(goal: AuditGoal) {
    this.goal = goal
  }

  generateFromFlywheelAnalysis(metrics: FlywheelMetrics[]): GeneratedRecommendation[] {
    const flywheelRecs: GeneratedRecommendation[] = []

    // Sort by flywheel score descending
    const sortedMetrics = [...metrics].sort((a, b) => b.flywheelScore - a.flywheelScore)

    sortedMetrics.forEach((metric) => {
      if (metric.recommendedAction === 'reduce_spend' && metric.recommendedSpendReduction) {
        const monthlySpend = metric.adSpend / 30 // Approximate monthly
        const savingsAmount = monthlySpend * (metric.recommendedSpendReduction / 100)
        
        flywheelRecs.push({
          id: `rec-${++this.idCounter}`,
          category: 'flywheel',
          priority: this.calculatePriority('costReduction', savingsAmount, metric.confidenceLevel),
          title: `Reduce ad spend for high-momentum ASIN ${metric.asin}`,
          description: `This product shows strong organic momentum with only ${metric.adAttributionPercentage.toFixed(1)}% of sales from ads. The flywheel trend is ${metric.flywheelTrend}, indicating ${metric.flywheelTrend === 'increasing' ? 'growing' : metric.flywheelTrend === 'decreasing' ? 'declining' : 'stable'} organic demand.`,
          impact: {
            metric: 'Monthly Ad Spend',
            current: `$${monthlySpend.toFixed(2)}`,
            projected: `$${(monthlySpend * (1 - metric.recommendedSpendReduction / 100)).toFixed(2)}`,
            improvement: `${metric.recommendedSpendReduction}% reduction`
          },
          action: `Gradually reduce bids by ${metric.recommendedSpendReduction}% over 2-4 weeks while monitoring organic rank`,
          estimatedValue: savingsAmount,
          timeToImplement: '1-2 weeks',
          confidence: metric.confidenceLevel,
          context: { asin: metric.asin }
        })
      }

      // Growth opportunity for low flywheel score
      if (metric.flywheelScore < 30 && metric.roas > 3) {
        const monthlyRevenue = metric.totalRevenue / 30
        const growthPotential = monthlyRevenue * 0.3 // 30% growth estimate

        flywheelRecs.push({
          id: `rec-${++this.idCounter}`,
          category: 'growth',
          priority: this.calculatePriority('revenueGrowth', growthPotential, 'medium'),
          title: `Increase investment in high-ROAS ASIN ${metric.asin}`,
          description: `This product has strong ROAS (${metric.roas.toFixed(1)}x) but low organic momentum. Increased ad investment could accelerate the flywheel.`,
          impact: {
            metric: 'Monthly Revenue',
            current: `$${monthlyRevenue.toFixed(2)}`,
            projected: `$${(monthlyRevenue * 1.3).toFixed(2)}`,
            improvement: '30% increase'
          },
          action: 'Increase campaign budgets by 50% and expand keyword targeting',
          estimatedValue: growthPotential,
          timeToImplement: '1 week',
          confidence: 'medium',
          context: { asin: metric.asin }
        })
      }
    })

    return flywheelRecs
  }

  generateFromPerformanceMetrics(performanceData: any): GeneratedRecommendation[] {
    const perfRecs: GeneratedRecommendation[] = []

    // High ACoS optimization
    if (performanceData.campaigns) {
      const highAcosCampaigns = performanceData.campaigns
        .filter((c: any) => c.acos > 35 && c.spend > 100)
        .sort((a: any, b: any) => b.spend - a.spend)

      highAcosCampaigns.slice(0, 5).forEach((campaign: any) => {
        const potentialSavings = campaign.spend * 0.25 // 25% reduction estimate

        perfRecs.push({
          id: `rec-${++this.idCounter}`,
          category: 'efficiency',
          priority: this.calculatePriority('efficiencyImprovement', potentialSavings, 'high'),
          title: `Optimize high-ACoS campaign "${campaign.campaignName}"`,
          description: `This campaign has an ACoS of ${campaign.acos.toFixed(1)}%, well above the target of 25-30%. There's significant room for efficiency improvement.`,
          impact: {
            metric: 'ACoS',
            current: `${campaign.acos.toFixed(1)}%`,
            projected: '25-30%',
            improvement: `${(campaign.acos - 27.5).toFixed(1)}pp reduction`
          },
          action: 'Review search term report, add negative keywords, adjust bids based on conversion data',
          estimatedValue: potentialSavings,
          timeToImplement: '3-5 days',
          confidence: 'high',
          context: { campaign: campaign.campaignName }
        })
      })
    }

    // Low CTR improvement
    if (performanceData.adGroups) {
      const lowCtrAdGroups = performanceData.adGroups
        .filter((ag: any) => ag.ctr < 0.3 && ag.impressions > 10000)
        .sort((a: any, b: any) => b.impressions - a.impressions)

      lowCtrAdGroups.slice(0, 3).forEach((adGroup: any) => {
        const revenueOpportunity = (adGroup.sales / adGroup.ctr) * 0.5 * 0.2 // Potential from CTR improvement

        perfRecs.push({
          id: `rec-${++this.idCounter}`,
          category: 'growth',
          priority: this.calculatePriority('revenueGrowth', revenueOpportunity, 'medium'),
          title: `Improve CTR for ad group "${adGroup.adGroupName}"`,
          description: `CTR of ${adGroup.ctr.toFixed(2)}% is below the 0.47% benchmark. Better ad copy and targeting could significantly improve performance.`,
          impact: {
            metric: 'CTR',
            current: `${adGroup.ctr.toFixed(2)}%`,
            projected: '0.5%+',
            improvement: `${(0.5 - adGroup.ctr).toFixed(2)}pp increase`
          },
          action: 'Test new ad headlines, refine keyword match types, improve product images',
          estimatedValue: revenueOpportunity,
          timeToImplement: '1-2 weeks',
          confidence: 'medium',
          context: { 
            campaign: adGroup.campaignName,
            adGroup: adGroup.adGroupName 
          }
        })
      })
    }

    // Top performer scaling
    const topPerformers = performanceData.campaigns
      ?.filter((c: any) => c.roas > 4 && c.acos < 25)
      .sort((a: any, b: any) => b.sales - a.sales)

    topPerformers?.slice(0, 3).forEach((campaign: any) => {
      const scaleOpportunity = campaign.sales * 0.5 // 50% growth potential

      perfRecs.push({
        id: `rec-${++this.idCounter}`,
        category: 'growth',
        priority: this.calculatePriority('revenueGrowth', scaleOpportunity, 'high'),
        title: `Scale high-performing campaign "${campaign.campaignName}"`,
        description: `With ROAS of ${campaign.roas.toFixed(1)}x and ACoS of ${campaign.acos.toFixed(1)}%, this campaign has room to scale profitably.`,
        impact: {
          metric: 'Revenue',
          current: `$${campaign.sales.toFixed(2)}`,
          projected: `$${(campaign.sales * 1.5).toFixed(2)}`,
          improvement: '50% increase'
        },
        action: 'Increase daily budget by 50%, expand to similar keywords, test dayparting for optimal performance',
        estimatedValue: scaleOpportunity,
        timeToImplement: '3-5 days',
        confidence: 'high',
        context: { campaign: campaign.campaignName }
      })
    })

    return perfRecs
  }

  generateDefensiveRecommendations(competitorData?: any): GeneratedRecommendation[] {
    const defRecs: GeneratedRecommendation[] = []

    // Placeholder for defensive recommendations
    // In a real implementation, this would analyze:
    // - Share of voice trends
    // - Competitor bid activity
    // - Brand defense keywords
    // - Market share erosion risks

    if (this.goal === 'defense') {
      defRecs.push({
        id: `rec-${++this.idCounter}`,
        category: 'defense',
        priority: 8,
        title: 'Strengthen brand keyword defense',
        description: 'Ensure maximum coverage on brand terms to prevent competitor conquesting.',
        impact: {
          metric: 'Brand Share of Voice',
          current: '75%',
          projected: '95%+',
          improvement: '20pp increase'
        },
        action: 'Create exact match campaigns for all brand variations, set aggressive bids',
        estimatedValue: 5000, // Placeholder
        timeToImplement: '2-3 days',
        confidence: 'high'
      })
    }

    return defRecs
  }

  private calculatePriority(
    type: keyof typeof goalScoringWeights['profitability'], 
    value: number,
    confidence: 'high' | 'medium' | 'low'
  ): number {
    const baseScore = Math.min(value / 1000, 5) // Normalize to 0-5 based on $1000 increments
    const goalWeight = goalScoringWeights[this.goal][type] || 1.0
    const confidenceMultiplier = confidence === 'high' ? 1.2 : confidence === 'medium' ? 1.0 : 0.8
    
    return Math.min(Math.round(baseScore * goalWeight * confidenceMultiplier * 2), 10)
  }

  getAllRecommendations(
    flywheelMetrics: FlywheelMetrics[],
    performanceData: any,
    competitorData?: any
  ): GeneratedRecommendation[] {
    this.recommendations = []
    this.idCounter = 0

    // Generate recommendations from each source
    const flywheelRecs = this.generateFromFlywheelAnalysis(flywheelMetrics)
    const performanceRecs = this.generateFromPerformanceMetrics(performanceData)
    const defensiveRecs = this.generateDefensiveRecommendations(competitorData)

    // Combine all recommendations
    this.recommendations = [...flywheelRecs, ...performanceRecs, ...defensiveRecs]

    // Sort by priority (descending) and take top 15
    return this.recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 15)
  }
}