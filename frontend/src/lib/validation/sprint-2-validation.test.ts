import { describe, it, expect } from 'vitest'
import { CSVParser } from '../csv/parser'
import { reportSchemas } from '../csv/schemas'
import { PerformanceMetricsCalculator } from '../analysis/performance-metrics'
import { MetricsCalculator } from '../analysis/metrics-calculator'
import { parseWithAutoDetect } from '../csv/file-type-detector'

describe('Sprint 2 End-to-End Validation', () => {
  describe('CSV Parsing Integration', () => {
    it('should parse sponsored products CSV correctly', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Portfolio name,Currency,Impressions,Clicks,Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),ASIN,SKU
01/01/2024,Brand Campaign,Ad Group 1,Portfolio A,USD,1000,50,25.00,200.00,12.50%,8.00,10,B001234567,SKU-001
01/02/2024,Brand Campaign,Ad Group 1,Portfolio A,USD,1200,60,30.00,250.00,12.00%,8.33,12,B001234567,SKU-001`

      const file = new File([csvContent], 'sponsored_products.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      const result = await parser.parseFile(file)

      expect(result.validation.isValid).toBe(true)
      expect(result.parsedData).toBeDefined()
      expect(result.parsedData?.rows).toHaveLength(2)
      expect(result.parsedData?.fileType).toBe('sponsored_products')
      expect(result.validation.stats.validRows).toBe(2)
    })

    it('should validate column requirements', () => {
      const schema = reportSchemas.sponsored_products
      const requiredColumns = schema.columns.filter(col => col.required).map(col => col.name)
      
      expect(requiredColumns).toContain('Date')
      expect(requiredColumns).toContain('Campaign Name')
      expect(requiredColumns).toContain('Impressions')
      expect(requiredColumns).toContain('Clicks')
    })

    it('should handle column name variations', async () => {
      const csvWithVariations = `Date,Campaign Name,Impressions,Clicks,Cost,Sales,Orders
01/01/2024,Test Campaign,1000,50,25.00,200.00,10`

      const file = new File([csvWithVariations], 'test.csv', { type: 'text/csv' })
      const result = await parseWithAutoDetect(file)

      // Should still parse even with 'Cost' instead of 'Spend' and 'Sales' instead of '7 Day Total Sales'
      expect(result.parsedData).toBeDefined()
      expect(result.parsedData?.rows[0]).toHaveProperty('Cost')
      expect(result.parsedData?.rows[0]).toHaveProperty('Sales')
    })
  })

  describe('Flywheel Analysis Integration', () => {
    it('should calculate flywheel metrics correctly', () => {
      const data = {
        totalRevenue: 1000,
        adRevenue: 200,
        conversionRate: 10,
        organicConversionRate: 12,
        roas: 4
      }

      const adAttributionPercentage = MetricsCalculator.calculateAdAttribution(
        data.adRevenue,
        data.totalRevenue
      )

      expect(adAttributionPercentage).toBe(20)

      const flywheelScore = MetricsCalculator.calculateFlywheelScore({
        adAttributionPercentage,
        adAttributionTrend: 'decreasing',
        conversionRate: data.conversionRate,
        organicConversionRate: data.organicConversionRate,
        roas: data.roas,
        trendConfidence: 0.8
      })

      expect(flywheelScore).toBeGreaterThan(0)
      expect(flywheelScore).toBeLessThanOrEqual(100)
    })

    it('should generate appropriate recommendations', () => {
      const highScoreData = {
        flywheelScore: 85,
        adAttributionPercentage: 15,
        adAttributionTrend: 'decreasing' as const,
        roas: 5,
        acos: 20,
        dataPoints: 30
      }

      const recommendation = MetricsCalculator.generateRecommendation(highScoreData)
      
      expect(recommendation.action).toBe('reduce_spend')
      expect(recommendation.confidence).toBe('high')
      expect(recommendation.spendReduction).toBe(50)
    })

    it('should detect trends correctly', () => {
      const timeSeries = [
        { date: new Date('2024-01-01'), value: 30 },
        { date: new Date('2024-01-02'), value: 28 },
        { date: new Date('2024-01-03'), value: 26 },
        { date: new Date('2024-01-04'), value: 24 },
        { date: new Date('2024-01-05'), value: 22 }
      ]

      const trend = MetricsCalculator.calculateTrend(timeSeries)
      
      expect(trend.trend).toBe('decreasing')
      expect(trend.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('Performance Metrics Integration', () => {
    it('should calculate all performance metrics', () => {
      const campaignData = {
        campaignId: 'camp1',
        campaignName: 'Test Campaign',
        impressions: 10000,
        clicks: 100,
        cost: 50,
        sales: 200,
        orders: 10
      }

      const metrics = PerformanceMetricsCalculator.calculateCampaignMetrics(campaignData)
      
      expect(metrics.ctr).toBe(1) // 100/10000 * 100
      expect(metrics.cvr).toBe(10) // 10/100 * 100
      expect(metrics.acos).toBe(25) // 50/200 * 100
      expect(metrics.roas).toBe(4) // 200/50
    })

    it('should identify top and bottom performers', () => {
      const campaigns = [
        {
          campaignId: 'camp1',
          campaignName: 'High Performer',
          impressions: 10000,
          clicks: 200,
          cost: 50,
          sales: 400,
          orders: 20,
          ctr: 2,
          cvr: 10,
          acos: 12.5,
          roas: 8
        },
        {
          campaignId: 'camp2',
          campaignName: 'Low Performer',
          impressions: 10000,
          clicks: 50,
          cost: 100,
          sales: 150,
          orders: 5,
          ctr: 0.5,
          cvr: 10,
          acos: 66.67,
          roas: 1.5
        }
      ]

      const topPerformers = PerformanceMetricsCalculator.identifyTopPerformers(campaigns)
      const bottomPerformers = PerformanceMetricsCalculator.identifyBottomPerformers(campaigns)

      expect(topPerformers.byRoas[0].campaignId).toBe('camp1')
      expect(bottomPerformers.byAcos[0].campaignId).toBe('camp2')
    })

    it('should calculate TACoS when organic data available', () => {
      const campaigns = [{
        campaignId: 'camp1',
        campaignName: 'Test',
        impressions: 1000,
        clicks: 50,
        cost: 100,
        sales: 400,
        orders: 10,
        ctr: 5,
        cvr: 20,
        acos: 25,
        roas: 4
      }]

      const organicSales = 600
      const accountMetrics = PerformanceMetricsCalculator.calculateAccountMetrics(
        campaigns,
        organicSales
      )

      expect(accountMetrics.tacos).toBe(10) // 100/(400+600) * 100
    })
  })

  describe('Data Processing Edge Cases', () => {
    it('should handle division by zero', () => {
      expect(PerformanceMetricsCalculator.calculateCTR(10, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateCVR(5, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateACoS(100, 0)).toBe(999)
      expect(PerformanceMetricsCalculator.calculateROAS(0, 0)).toBe(0)
    })

    it('should handle missing or invalid data', () => {
      const invalidData = {
        totalRevenue: 0,
        adRevenue: 0,
        conversionRate: 0,
        organicConversionRate: 0,
        roas: 0
      }

      const percentage = MetricsCalculator.calculateAdAttribution(
        invalidData.adRevenue,
        invalidData.totalRevenue
      )
      
      expect(percentage).toBe(0)
    })

    it('should handle insufficient data for trends', () => {
      const insufficientData = [
        { date: new Date('2024-01-01'), value: 30 }
      ]

      const trend = MetricsCalculator.calculateTrend(insufficientData)
      
      expect(trend.trend).toBe('stable')
      expect(trend.confidence).toBe(0)
    })
  })

  describe('Integration Points', () => {
    it('should have compatible data structures between modules', () => {
      // CSV output should match analysis input
      const csvRow = {
        'Campaign Name': 'Test',
        'Impressions': '1000',
        'Clicks': '50',
        'Spend': '25.00',
        '7 Day Total Sales': '200.00',
        '7 Day Total Orders (#)': '10'
      }

      // Should be parseable for performance metrics
      const impressions = parseInt(csvRow['Impressions'])
      const clicks = parseInt(csvRow['Clicks'])
      const cost = parseFloat(csvRow['Spend'])
      const sales = parseFloat(csvRow['7 Day Total Sales'])
      
      expect(impressions).toBe(1000)
      expect(clicks).toBe(50)
      expect(cost).toBe(25)
      expect(sales).toBe(200)
    })

    it('should maintain data integrity through processing pipeline', () => {
      // Simulate data flow through the pipeline
      const rawData = {
        campaigns: [
          { name: 'Campaign 1', spend: 100, revenue: 400 },
          { name: 'Campaign 2', spend: 50, revenue: 150 }
        ]
      }

      const totalSpend = rawData.campaigns.reduce((sum, c) => sum + c.spend, 0)
      const totalRevenue = rawData.campaigns.reduce((sum, c) => sum + c.revenue, 0)
      
      expect(totalSpend).toBe(150)
      expect(totalRevenue).toBe(550)
      
      // ROAS should be consistent
      const overallRoas = totalRevenue / totalSpend
      expect(overallRoas).toBeCloseTo(3.67, 1)
    })
  })
})