'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Target, 
  Rocket, 
  Shield, 
  Grid3X3,
  CheckCircle,
  Info
} from 'lucide-react'

export type AuditGoal = 'profitability' | 'growth' | 'launch' | 'defense' | 'portfolio'

interface GoalOption {
  id: AuditGoal
  title: string
  description: string
  icon: React.ReactNode
  benefits: string[]
  color: string
  bgColor: string
  borderColor: string
}

const goalOptions: GoalOption[] = [
  {
    id: 'profitability',
    title: 'Maximize Profitability',
    description: 'Focus on improving margins and reducing wasted spend',
    icon: <Target className="w-6 h-6" />,
    benefits: [
      'Identify products ready for reduced ad spend',
      'Find keywords with poor conversion rates',
      'Optimize bids for maximum ROI'
    ],
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'growth',
    title: 'Scale Revenue',
    description: 'Expand market share while maintaining efficiency',
    icon: <TrendingUp className="w-6 h-6" />,
    benefits: [
      'Discover new keyword opportunities',
      'Identify products with growth potential',
      'Balance volume and profitability'
    ],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'launch',
    title: 'Launch Optimization',
    description: 'Perfect your strategy for new product launches',
    icon: <Rocket className="w-6 h-6" />,
    benefits: [
      'Optimize launch campaign structure',
      'Identify early momentum indicators',
      'Accelerate organic ranking'
    ],
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'defense',
    title: 'Defend Market Share',
    description: 'Protect your position from competitive threats',
    icon: <Shield className="w-6 h-6" />,
    benefits: [
      'Monitor competitor activity',
      'Strengthen defensive keywords',
      'Identify market share risks'
    ],
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'portfolio',
    title: 'Portfolio Balance',
    description: 'Optimize performance across your entire catalog',
    icon: <Grid3X3 className="w-6 h-6" />,
    benefits: [
      'Balance investment across products',
      'Identify portfolio-wide patterns',
      'Optimize cross-product strategies'
    ],
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
]

interface GoalSelectionProps {
  selectedGoal?: AuditGoal
  onGoalSelect: (goal: AuditGoal) => void
  onContinue: () => void
  canChangeGoal?: boolean
}

export function GoalSelection({ 
  selectedGoal, 
  onGoalSelect, 
  onContinue,
  canChangeGoal = true 
}: GoalSelectionProps) {
  const [hoveredGoal, setHoveredGoal] = useState<AuditGoal | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's your primary goal for this audit?
        </h2>
        <p className="text-gray-600">
          Your selection will customize the analysis and recommendations to best achieve your objective
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goalOptions.map((option) => {
          const isSelected = selectedGoal === option.id
          const isHovered = hoveredGoal === option.id

          return (
            <button
              key={option.id}
              onClick={() => onGoalSelect(option.id)}
              onMouseEnter={() => setHoveredGoal(option.id)}
              onMouseLeave={() => setHoveredGoal(null)}
              disabled={!canChangeGoal && !isSelected}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected 
                  ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-2 ring-${option.color.split('-')[1]}-500` 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${!canChangeGoal && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isHovered && !isSelected ? 'transform -translate-y-1 shadow-lg' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className={`w-5 h-5 ${option.color}`} />
                </div>
              )}
              
              <div className={`flex items-center gap-3 mb-3 ${isSelected ? option.color : 'text-gray-700'}`}>
                {option.icon}
                <h3 className="font-semibold text-lg">{option.title}</h3>
              </div>
              
              <p className={`text-sm mb-4 ${isSelected ? option.color : 'text-gray-600'}`}>
                {option.description}
              </p>

              {(isSelected || isHovered) && (
                <ul className="space-y-2">
                  {option.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? option.color : 'text-gray-400'}`} />
                      <span className={`text-sm ${isSelected ? option.color : 'text-gray-600'}`}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>
            This choice will prioritize relevant insights and recommendations in your report
          </span>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Learn more
          </button>
        </div>

        {showTooltip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="mb-2">
              <strong>How goals affect your analysis:</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>• Recommendations are weighted based on your goal</li>
              <li>• Flywheel opportunities are prioritized differently</li>
              <li>• Report sections are reordered for relevance</li>
              <li>• Success metrics are customized to your objective</li>
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onContinue}
            disabled={!selectedGoal}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${selectedGoal 
                ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue to Analysis
          </button>
        </div>
      </div>
    </div>
  )
}