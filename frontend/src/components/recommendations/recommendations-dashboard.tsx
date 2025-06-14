'use client'

import { useState, useEffect } from 'react'
import { 
  Filter, 
  Download, 
  TrendingUp,
  DollarSign,
  Target,
  Lightbulb,
  ChevronDown
} from 'lucide-react'
import { RecommendationCard, RecommendationType, ImpactLevel } from './recommendation-card'
import { AuditGoal } from '../audits/goal-selection'
import type { Recommendation } from '@/types/recommendation'

interface RecommendationData {
  id: string
  title: string
  description: string
  type: RecommendationType
  impactLevel: ImpactLevel
  confidence: 'high' | 'medium' | 'low'
  impact: {
    metric: string
    current: number | string
    projected: number | string
    improvement: number | string
  }
  action: string
  estimatedSavings?: number
  timeToImplement?: string
  asin?: string
  keyword?: string
  campaign?: string
  goalAlignment: number // 0-1 score for how well it aligns with selected goal
}

interface RecommendationsDashboardProps {
  auditId: string
  goal: AuditGoal
  flywheelData?: any
  performanceData?: any
  onRecommendationsGenerated?: (recommendations: Recommendation[]) => void
}

// Goal-based weighting for recommendation types
const goalWeights: Record<AuditGoal, Record<RecommendationType, number>> = {
  profitability: {
    quick_win: 1.5,
    strategic: 1.2,
    defensive: 0.8,
    growth: 0.5
  },
  growth: {
    quick_win: 0.8,
    strategic: 1.0,
    defensive: 0.5,
    growth: 1.5
  },
  launch: {
    quick_win: 1.2,
    strategic: 0.8,
    defensive: 0.5,
    growth: 1.3
  },
  defense: {
    quick_win: 0.8,
    strategic: 1.0,
    defensive: 1.5,
    growth: 0.7
  },
  portfolio: {
    quick_win: 1.0,
    strategic: 1.3,
    defensive: 1.0,
    growth: 1.0
  }
}

export function RecommendationsDashboard({ 
  auditId, 
  goal, 
  flywheelData,
  performanceData,
  onRecommendationsGenerated 
}: RecommendationsDashboardProps) {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<RecommendationType | 'all'>('all')
  const [selectedImpact, setSelectedImpact] = useState<ImpactLevel | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    generateRecommendations()
  }, [flywheelData, performanceData, goal])

  useEffect(() => {
    filterRecommendations()
  }, [recommendations, selectedType, selectedImpact])

  const generateRecommendations = () => {
    const recs: RecommendationData[] = []

    // Generate flywheel-based recommendations
    if (flywheelData?.flywheelOpportunities) {
      flywheelData.flywheelOpportunities.forEach((opp: any, index: number) => {
        recs.push({
          id: `flywheel-${index}`,
          title: `Reduce ad spend for ${opp.asin}`,
          description: `This product has ${opp.adAttributionPercentage}% ad attribution with a declining trend. Organic momentum is strong.`,
          type: 'quick_win',
          impactLevel: opp.recommendedSpendReduction > 30 ? 'high' : 'medium',
          confidence: opp.confidence,
          impact: {
            metric: 'Monthly Ad Spend',
            current: `$${opp.currentSpend.toFixed(2)}`,
            projected: `$${(opp.currentSpend * (1 - opp.recommendedSpendReduction / 100)).toFixed(2)}`,
            improvement: `${opp.recommendedSpendReduction}% reduction`
          },
          action: opp.recommendedAction,
          estimatedSavings: opp.estimatedMonthlySavings,
          timeToImplement: '1-2 days',
          asin: opp.asin,
          goalAlignment: calculateGoalAlignment('quick_win', goal)
        })
      })
    }

    // Generate performance-based recommendations
    if (performanceData) {
      // High ACoS campaigns
      if (performanceData.bottomPerformers?.byACoS) {
        performanceData.bottomPerformers.byACoS.forEach((campaign: any, index: number) => {
          if (campaign.acos > 40) {
            recs.push({
              id: `acos-${index}`,
              title: `Optimize high ACoS campaign`,
              description: `Campaign "${campaign.campaignName}" has an ACoS of ${campaign.acos.toFixed(1)}%, significantly above target.`,
              type: 'strategic',
              impactLevel: 'high',
              confidence: 'high',
              impact: {
                metric: 'ACoS',
                current: `${campaign.acos.toFixed(1)}%`,
                projected: '25-30%',
                improvement: `${(campaign.acos - 27.5).toFixed(1)}% reduction`
              },
              action: 'Review keyword bids, add negative keywords, and pause underperforming terms',
              estimatedSavings: campaign.spend * 0.3,
              timeToImplement: '3-5 days',
              campaign: campaign.campaignName,
              goalAlignment: calculateGoalAlignment('strategic', goal)
            })
          }
        })
      }

      // Low CTR opportunities
      if (performanceData.bottomPerformers?.byCTR) {
        performanceData.bottomPerformers.byCTR.forEach((campaign: any, index: number) => {
          if (campaign.ctr < 0.3) {
            recs.push({
              id: `ctr-${index}`,
              title: `Improve ad relevance and CTR`,
              description: `Campaign "${campaign.campaignName}" has a CTR of ${campaign.ctr.toFixed(2)}%, below industry average.`,
              type: 'growth',
              impactLevel: 'medium',
              confidence: 'medium',
              impact: {
                metric: 'CTR',
                current: `${campaign.ctr.toFixed(2)}%`,
                projected: '0.5%+',
                improvement: `${(0.5 - campaign.ctr).toFixed(2)}% increase`
              },
              action: 'Test new ad copy, refine targeting, and improve keyword relevance',
              timeToImplement: '1 week',
              campaign: campaign.campaignName,
              goalAlignment: calculateGoalAlignment('growth', goal)
            })
          }
        })
      }

      // High performers to scale
      if (performanceData.topPerformers?.byROAS) {
        performanceData.topPerformers.byROAS.forEach((campaign: any, index: number) => {
          if (campaign.roas > 4 && index < 3) {
            recs.push({
              id: `scale-${index}`,
              title: `Scale high-performing campaign`,
              description: `Campaign "${campaign.campaignName}" has excellent ROAS of ${campaign.roas.toFixed(1)}x.`,
              type: 'growth',
              impactLevel: 'high',
              confidence: 'high',
              impact: {
                metric: 'Revenue',
                current: `$${campaign.sales.toFixed(2)}`,
                projected: `$${(campaign.sales * 1.5).toFixed(2)}`,
                improvement: '50% increase'
              },
              action: 'Increase budget by 50%, expand to similar keywords, and test higher bids',
              timeToImplement: '2-3 days',
              campaign: campaign.campaignName,
              goalAlignment: calculateGoalAlignment('growth', goal)
            })
          }
        })
      }
    }

    // Sort by goal alignment and impact
    const sortedRecs = recs.sort((a, b) => {
      const scoreA = a.goalAlignment * (a.impactLevel === 'high' ? 3 : a.impactLevel === 'medium' ? 2 : 1)
      const scoreB = b.goalAlignment * (b.impactLevel === 'high' ? 3 : b.impactLevel === 'medium' ? 2 : 1)
      return scoreB - scoreA
    })

    const topRecommendations = sortedRecs.slice(0, 15) // Top 15 recommendations
    setRecommendations(topRecommendations)
    
    // Call the callback if provided
    if (onRecommendationsGenerated) {
      // Convert to external format
      const externalFormat: Recommendation[] = topRecommendations.map((rec, index) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        type: rec.type,
        impact: rec.impactLevel,
        confidence: rec.confidence,
        priority: index + 1,
        action_items: [rec.action],
        estimated_savings: rec.estimatedSavings,
        affected_entity: rec.asin || rec.keyword || rec.campaign,
        metric_impact: {
          metric: rec.impact.metric,
          current_value: typeof rec.impact.current === 'number' ? rec.impact.current : 0,
          projected_value: typeof rec.impact.projected === 'number' ? rec.impact.projected : 0,
          improvement_percentage: typeof rec.impact.improvement === 'string' 
            ? parseFloat(rec.impact.improvement) || 0 
            : rec.impact.improvement
        },
        implementation_time: rec.timeToImplement,
        category: rec.type
      }))
      onRecommendationsGenerated(externalFormat)
    }
    
    setLoading(false)
  }

  const calculateGoalAlignment = (type: RecommendationType, goal: AuditGoal): number => {
    return goalWeights[goal][type] || 1.0
  }

  const filterRecommendations = () => {
    let filtered = [...recommendations]

    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedType)
    }

    if (selectedImpact !== 'all') {
      filtered = filtered.filter(r => r.impactLevel === selectedImpact)
    }

    setFilteredRecommendations(filtered)
  }

  const exportRecommendations = () => {
    const csv = [
      ['Title', 'Type', 'Impact', 'Current', 'Projected', 'Action', 'Est. Savings'],
      ...filteredRecommendations.map(r => [
        r.title,
        r.type,
        r.impactLevel,
        r.impact.current,
        r.impact.projected,
        r.action,
        r.estimatedSavings?.toFixed(2) || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recommendations-${auditId}.csv`
    a.click()
  }

  const totalEstimatedSavings = filteredRecommendations
    .reduce((sum, r) => sum + (r.estimatedSavings || 0), 0)

  const categoryCounts = {
    quick_win: filteredRecommendations.filter(r => r.type === 'quick_win').length,
    strategic: filteredRecommendations.filter(r => r.type === 'strategic').length,
    defensive: filteredRecommendations.filter(r => r.type === 'defensive').length,
    growth: filteredRecommendations.filter(r => r.type === 'growth').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Optimization Recommendations
            </h2>
            <p className="text-gray-600">
              {filteredRecommendations.length} actionable recommendations based on your {goal} goal
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={exportRecommendations}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${totalEstimatedSavings.toFixed(0)}/mo
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm font-medium">Quick Wins</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{categoryCounts.quick_win}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Strategic</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{categoryCounts.strategic}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Growth</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{categoryCounts.growth}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as RecommendationType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="quick_win">Quick Wins</option>
                <option value="strategic">Strategic</option>
                <option value="defensive">Defensive</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Level
              </label>
              <select
                value={selectedImpact}
                onChange={(e) => setSelectedImpact(e.target.value as ImpactLevel | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Impacts</option>
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            {...recommendation}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No recommendations match your current filters.</p>
        </div>
      )}
    </div>
  )
}