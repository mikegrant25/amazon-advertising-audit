import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  ChevronRight,
  Zap,
  Target,
  Shield
} from 'lucide-react'

export type RecommendationType = 'quick_win' | 'strategic' | 'defensive' | 'growth'
export type ImpactLevel = 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

interface RecommendationCardProps {
  title: string
  description: string
  impact: {
    metric: string
    current: number | string
    projected: number | string
    improvement: number | string
  }
  action: string
  type: RecommendationType
  impactLevel: ImpactLevel
  confidence: ConfidenceLevel
  estimatedSavings?: number
  timeToImplement?: string
  asin?: string
  keyword?: string
  campaign?: string
}

const typeConfig = {
  quick_win: {
    icon: Zap,
    label: 'Quick Win',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  strategic: {
    icon: Target,
    label: 'Strategic',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  defensive: {
    icon: Shield,
    label: 'Defensive',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  growth: {
    icon: TrendingUp,
    label: 'Growth',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
}

const impactColors = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-gray-600'
}

const confidenceIndicators = {
  high: { dots: 3, label: 'High confidence' },
  medium: { dots: 2, label: 'Medium confidence' },
  low: { dots: 1, label: 'Low confidence' }
}

export function RecommendationCard({
  title,
  description,
  impact,
  action,
  type,
  impactLevel,
  confidence,
  estimatedSavings,
  timeToImplement,
  asin,
  keyword,
  campaign
}: RecommendationCardProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={`bg-white rounded-lg border-2 ${config.borderColor} p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`text-sm ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence Indicator */}
          <div className="flex items-center gap-1" title={confidenceIndicators[confidence].label}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < confidenceIndicators[confidence].dots 
                    ? 'bg-gray-700' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4">{description}</p>

      {/* Context */}
      {(asin || keyword || campaign) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {asin && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              ASIN: {asin}
            </span>
          )}
          {keyword && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              Keyword: {keyword}
            </span>
          )}
          {campaign && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              Campaign: {campaign}
            </span>
          )}
        </div>
      )}

      {/* Impact Metrics */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{impact.metric}</span>
          <span className={`text-sm font-medium ${impactColors[impactLevel]}`}>
            {impactLevel.toUpperCase()} IMPACT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-sm text-gray-500">Current</span>
            <p className="font-semibold">{impact.current}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-sm text-gray-500">Projected</span>
            <p className="font-semibold text-green-600">{impact.projected}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-sm text-gray-500">Improvement</span>
            <p className="font-semibold text-green-600">+{impact.improvement}</p>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {estimatedSavings !== undefined && (
          <div>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Est. Monthly Savings
            </span>
            <p className="font-semibold text-green-600">${estimatedSavings.toFixed(2)}</p>
          </div>
        )}
        {timeToImplement && (
          <div>
            <span className="text-sm text-gray-500">Time to Implement</span>
            <p className="font-semibold">{timeToImplement}</p>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Recommended Action:</p>
            <p className="text-sm text-blue-700">{action}</p>
          </div>
        </div>
      </div>
    </div>
  )
}