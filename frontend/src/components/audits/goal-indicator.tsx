import { 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  Grid3X3,
  Info
} from 'lucide-react'
import { AuditGoal } from './goal-selection'

interface GoalIndicatorProps {
  goal: AuditGoal
  variant?: 'compact' | 'full'
  showTooltip?: boolean
}

const goalConfig = {
  profitability: {
    icon: Target,
    label: 'Maximize Profitability',
    shortLabel: 'Profitability',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    tooltip: 'Analysis optimized for improving margins and reducing wasted spend'
  },
  growth: {
    icon: TrendingUp,
    label: 'Scale Revenue',
    shortLabel: 'Growth',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    tooltip: 'Analysis focused on expanding market share while maintaining efficiency'
  },
  launch: {
    icon: Rocket,
    label: 'Launch Optimization',
    shortLabel: 'Launch',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    tooltip: 'Analysis tailored for new product launch strategies'
  },
  defense: {
    icon: Shield,
    label: 'Defend Market Share',
    shortLabel: 'Defense',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    tooltip: 'Analysis focused on protecting your position from competitive threats'
  },
  portfolio: {
    icon: Grid3X3,
    label: 'Portfolio Balance',
    shortLabel: 'Portfolio',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    tooltip: 'Analysis optimized for performance across your entire catalog'
  }
}

export function GoalIndicator({ goal, variant = 'compact', showTooltip = true }: GoalIndicatorProps) {
  const config = goalConfig[goal]
  const Icon = config.icon

  if (variant === 'compact') {
    return (
      <div className="relative group inline-flex items-center">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.color}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{config.shortLabel}</span>
        </div>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap">
              {config.tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg ${config.bgColor} ${config.color} border border-current border-opacity-20`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <h4 className="font-semibold">{config.label}</h4>
          {showTooltip && (
            <p className="text-sm opacity-90 mt-1">{config.tooltip}</p>
          )}
        </div>
      </div>
    </div>
  )
}