import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { Audit, FlywheelAnalysis, PerformanceMetrics } from '@/types/audit'
import type { Recommendation } from '@/types/recommendation'

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 700 }
  ]
})

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 15,
    color: '#111827'
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#374151'
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#4b5563',
    marginBottom: 8
  },
  metric: {
    fontSize: 14,
    marginBottom: 6,
    color: '#374151'
  },
  metricValue: {
    fontWeight: 700,
    color: '#111827'
  },
  scoreCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280'
  },
  recommendation: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
    borderLeft: '4 solid #3b82f6'
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: '#111827'
  },
  recommendationText: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4
  },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  badge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 10,
    color: '#374151'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5
  },
  metricCard: {
    width: '48%',
    marginHorizontal: '1%',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10
  },
  metricCardTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827'
  },
  goalBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: 700
  }
})

interface PDFReportProps {
  audit: Audit
  flywheelAnalysis: FlywheelAnalysis | null
  performanceMetrics: PerformanceMetrics | null
  recommendations: Recommendation[]
}

const goalDisplayNames: Record<string, string> = {
  profitability: 'Maximize Profitability',
  growth: 'Scale Revenue',
  launch: 'Accelerate Launch',
  defense: 'Defend Market Share',
  portfolio: 'Optimize Portfolio'
}

export function PDFReport({ audit, flywheelAnalysis, performanceMetrics, recommendations }: PDFReportProps) {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const topRecommendations = recommendations.slice(0, 10)

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Amazon Advertising Audit Report</Text>
          <Text style={styles.subtitle}>{audit.name}</Text>
          <Text style={styles.subtitle}>Generated on {reportDate}</Text>
        </View>

        {audit.goal && (
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>
              Goal: {goalDisplayNames[audit.goal] || audit.goal}
            </Text>
          </View>
        )}

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          
          {flywheelAnalysis && (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreValue}>{flywheelAnalysis.score}</Text>
              <Text style={styles.scoreLabel}>Flywheel Score</Text>
            </View>
          )}

          <Text style={styles.text}>
            This audit analyzes your Amazon advertising performance with a focus on the paid-organic flywheel strategy.
            {flywheelAnalysis && ` Your overall flywheel score of ${flywheelAnalysis.score} indicates ${
              flywheelAnalysis.score >= 75 ? 'strong' : 
              flywheelAnalysis.score >= 50 ? 'moderate' : 'weak'
            } synergy between paid and organic performance.`}
          </Text>

          {flywheelAnalysis && (
            <>
              <Text style={styles.text}>
                Key findings show that {flywheelAnalysis.summary.ad_dependent_percentage.toFixed(1)}% of your ASINs 
                demonstrate strong correlation between ad spend and organic rank improvement.
              </Text>
              <Text style={styles.text}>
                We&apos;ve identified {topRecommendations.length} actionable recommendations aligned with your 
                {audit.goal ? ` ${goalDisplayNames[audit.goal] || audit.goal} goal` : ' business objectives'}.
              </Text>
            </>
          )}
        </View>

        <View style={[styles.footer, { position: 'relative' }]}>
          <Text style={styles.footerText}>
            Amazon Advertising Audit Tool - Confidential Report
          </Text>
        </View>
      </Page>

      {/* Flywheel Analysis Page */}
      {flywheelAnalysis && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flywheel Analysis</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>Ad-Dependent ASINs</Text>
                <Text style={styles.metricCardValue}>
                  {flywheelAnalysis.summary.ad_dependent_percentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>Total ASINs Analyzed</Text>
                <Text style={styles.metricCardValue}>
                  {flywheelAnalysis.summary.total_asins}
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>Avg. Ad Spend</Text>
                <Text style={styles.metricCardValue}>
                  ${flywheelAnalysis.summary.avg_ad_spend_per_asin.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>Avg. Organic Revenue</Text>
                <Text style={styles.metricCardValue}>
                  ${flywheelAnalysis.summary.avg_organic_revenue_per_asin.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.subsectionTitle}>Top Ad-Dependent Products</Text>
            {flywheelAnalysis.asins
              .filter(asin => asin.flywheel_metrics.is_ad_dependent)
              .slice(0, 5)
              .map((asin, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Text style={styles.metric}>
                    <Text style={styles.metricValue}>{asin.asin}</Text> - 
                    Ad Attribution: {(asin.flywheel_metrics.ad_attribution_percentage * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.text}>
                    ${asin.total_ad_spend.toFixed(2)} ad spend → 
                    ${asin.total_organic_revenue.toFixed(2)} organic revenue
                  </Text>
                </View>
              ))}
          </View>
        </Page>
      )}

      {/* Performance Metrics Page */}
      {performanceMetrics && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>Overall ACoS</Text>
                <Text style={styles.metricCardValue}>
                  {performanceMetrics.summary.overall_acos.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>CTR</Text>
                <Text style={styles.metricCardValue}>
                  {performanceMetrics.summary.ctr.toFixed(2)}%
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>CVR</Text>
                <Text style={styles.metricCardValue}>
                  {performanceMetrics.summary.cvr.toFixed(2)}%
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricCardTitle}>ROAS</Text>
                <Text style={styles.metricCardValue}>
                  {performanceMetrics.summary.roas.toFixed(2)}x
                </Text>
              </View>
            </View>

            <Text style={styles.subsectionTitle}>Top Performing Campaigns</Text>
            {performanceMetrics.top_performers.slice(0, 3).map((campaign, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.metric}>
                  <Text style={styles.metricValue}>{campaign.name}</Text>
                </Text>
                <Text style={styles.text}>
                  ACoS: {campaign.acos.toFixed(1)}% | 
                  ROAS: {campaign.roas.toFixed(2)}x | 
                  Spend: ${campaign.spend.toFixed(2)}
                </Text>
              </View>
            ))}

            <Text style={styles.subsectionTitle}>Underperforming Campaigns</Text>
            {performanceMetrics.bottom_performers.slice(0, 3).map((campaign, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.metric}>
                  <Text style={styles.metricValue}>{campaign.name}</Text>
                </Text>
                <Text style={styles.text}>
                  ACoS: {campaign.acos.toFixed(1)}% | 
                  ROAS: {campaign.roas.toFixed(2)}x | 
                  Spend: ${campaign.spend.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* Recommendations Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Recommendations</Text>
          <Text style={styles.text}>
            Based on your {audit.goal ? `${goalDisplayNames[audit.goal] || audit.goal} goal and ` : ''}
            analysis results, here are your prioritized action items:
          </Text>

          {topRecommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>
                {index + 1}. {rec.title}
              </Text>
              <Text style={styles.recommendationText}>
                {rec.description}
              </Text>
              {rec.action_items && rec.action_items.length > 0 && (
                <Text style={styles.recommendationText}>
                  • {rec.action_items[0]}
                </Text>
              )}
              <View style={styles.recommendationMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {rec.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Impact: {rec.impact}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Priority: {rec.priority}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Amazon Advertising Audit Tool - Page 4
          </Text>
        </View>
      </Page>
    </Document>
  )
}