import { describe, it, expect } from 'vitest'
import { MetricsCalculator } from '../metrics-calculator'
import { MetricDataPoint } from '../types'

describe('MetricsCalculator', () => {
  describe('calculateStandardMetrics', () => {
    it('should calculate all standard metrics correctly', () => {
      const data = {
        impressions: 10000,
        clicks: 100,
        spend: 50,
        sales: 500,
        orders: 10
      }
      
      const metrics = MetricsCalculator.calculateStandardMetrics(data)
      
      expect(metrics.acos).toBe(10) // 50/500 * 100
      expect(metrics.roas).toBe(10) // 500/50
      expect(metrics.ctr).toBe(1) // 100/10000 * 100
      expect(metrics.cvr).toBe(10) // 10/100 * 100
      expect(metrics.cpc).toBe(0.5) // 50/100
    })
    
    it('should handle division by zero', () => {
      const data = {
        impressions: 0,
        clicks: 0,
        spend: 0,
        sales: 0,
        orders: 0
      }
      
      const metrics = MetricsCalculator.calculateStandardMetrics(data)
      
      expect(metrics.acos).toBe(0)
      expect(metrics.roas).toBe(0)
      expect(metrics.ctr).toBe(0)
      expect(metrics.cvr).toBe(0)
      expect(metrics.cpc).toBe(0)
    })
  })
  
  describe('calculateAdAttribution', () => {
    it('should calculate ad attribution percentage correctly', () => {
      expect(MetricsCalculator.calculateAdAttribution(300, 1000)).toBe(30)
      expect(MetricsCalculator.calculateAdAttribution(0, 1000)).toBe(0)
      expect(MetricsCalculator.calculateAdAttribution(1000, 1000)).toBe(100)
    })
    
    it('should handle zero total revenue', () => {
      expect(MetricsCalculator.calculateAdAttribution(0, 0)).toBe(0)
    })
  })
  
  describe('calculateTrend', () => {
    it('should detect increasing trend', () => {
      const dataPoints: MetricDataPoint[] = [
        { date: new Date('2024-01-01'), value: 10 },
        { date: new Date('2024-01-02'), value: 15 },
        { date: new Date('2024-01-03'), value: 20 },
        { date: new Date('2024-01-04'), value: 25 },
        { date: new Date('2024-01-05'), value: 30 }
      ]
      
      const result = MetricsCalculator.calculateTrend(dataPoints)
      
      expect(result.trend).toBe('increasing')
      expect(result.slope).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.8)
    })
    
    it('should detect decreasing trend', () => {
      const dataPoints: MetricDataPoint[] = [
        { date: new Date('2024-01-01'), value: 30 },
        { date: new Date('2024-01-02'), value: 25 },
        { date: new Date('2024-01-03'), value: 20 },
        { date: new Date('2024-01-04'), value: 15 },
        { date: new Date('2024-01-05'), value: 10 }
      ]
      
      const result = MetricsCalculator.calculateTrend(dataPoints)
      
      expect(result.trend).toBe('decreasing')
      expect(result.slope).toBeLessThan(0)
      expect(result.confidence).toBeGreaterThan(0.8)
    })
    
    it('should detect stable trend', () => {
      const dataPoints: MetricDataPoint[] = [
        { date: new Date('2024-01-01'), value: 20 },
        { date: new Date('2024-01-02'), value: 21 },
        { date: new Date('2024-01-03'), value: 19 },
        { date: new Date('2024-01-04'), value: 20 },
        { date: new Date('2024-01-05'), value: 20 }
      ]
      
      const result = MetricsCalculator.calculateTrend(dataPoints)
      
      expect(result.trend).toBe('stable')
      expect(Math.abs(result.slope)).toBeLessThan(1)
    })
    
    it('should handle insufficient data', () => {
      const dataPoints: MetricDataPoint[] = [
        { date: new Date('2024-01-01'), value: 20 }
      ]
      
      const result = MetricsCalculator.calculateTrend(dataPoints)
      
      expect(result.trend).toBe('stable')
      expect(result.slope).toBe(0)
      expect(result.confidence).toBe(0)
    })
  })
  
  describe('calculateFlywheelScore', () => {
    it('should give high score for low ad attribution with decreasing trend', () => {
      const score = MetricsCalculator.calculateFlywheelScore({
        adAttributionPercentage: 20,
        adAttributionTrend: 'decreasing',
        conversionRate: 5,
        organicConversionRate: 4,
        roas: 5,
        trendConfidence: 0.8
      })
      
      expect(score).toBeGreaterThan(70)
    })
    
    it('should give low score for high ad attribution with increasing trend', () => {
      const score = MetricsCalculator.calculateFlywheelScore({
        adAttributionPercentage: 80,
        adAttributionTrend: 'increasing',
        conversionRate: 5,
        organicConversionRate: 1,
        roas: 2,
        trendConfidence: 0.8
      })
      
      expect(score).toBeLessThan(30)
    })
    
    it('should cap score at 100', () => {
      const score = MetricsCalculator.calculateFlywheelScore({
        adAttributionPercentage: 5,
        adAttributionTrend: 'decreasing',
        conversionRate: 2,
        organicConversionRate: 10,
        roas: 10,
        trendConfidence: 1
      })
      
      expect(score).toBeGreaterThan(95)
      expect(score).toBeLessThanOrEqual(100)
    })
    
    it('should not go below 0', () => {
      const score = MetricsCalculator.calculateFlywheelScore({
        adAttributionPercentage: 100,
        adAttributionTrend: 'increasing',
        conversionRate: 10,
        organicConversionRate: 0,
        roas: 1,
        trendConfidence: 1
      })
      
      expect(score).toBe(0)
    })
  })
  
  describe('generateRecommendation', () => {
    it('should recommend spend reduction for high flywheel score', () => {
      const rec = MetricsCalculator.generateRecommendation({
        flywheelScore: 75,
        adAttributionPercentage: 25,
        adAttributionTrend: 'decreasing',
        acos: 15,
        roas: 4,
        dataPoints: 30
      })
      
      expect(rec.action).toBe('reduce_spend')
      expect(rec.spendReduction).toBe(25)
      expect(rec.confidence).toBe('high')
      expect(rec.reasoning).toContain('Strong organic momentum detected')
    })
    
    it('should recommend aggressive reduction for very high score', () => {
      const rec = MetricsCalculator.generateRecommendation({
        flywheelScore: 90,
        adAttributionPercentage: 10,
        adAttributionTrend: 'decreasing',
        acos: 10,
        roas: 6,
        dataPoints: 45
      })
      
      expect(rec.action).toBe('reduce_spend')
      expect(rec.spendReduction).toBeGreaterThanOrEqual(50)
    })
    
    it('should recommend pause for poor performance', () => {
      const rec = MetricsCalculator.generateRecommendation({
        flywheelScore: 25,
        adAttributionPercentage: 90,
        adAttributionTrend: 'stable',
        acos: 40,
        roas: 1.5,
        dataPoints: 20
      })
      
      expect(rec.action).toBe('pause')
      expect(rec.reasoning).toContain('Poor advertising efficiency')
    })
    
    it('should have low confidence with limited data', () => {
      const rec = MetricsCalculator.generateRecommendation({
        flywheelScore: 75,
        adAttributionPercentage: 25,
        adAttributionTrend: 'decreasing',
        acos: 15,
        roas: 4,
        dataPoints: 5
      })
      
      expect(rec.confidence).toBe('low')
      expect(rec.reasoning).toContain('Limited data available')
    })
    
    it('should handle edge case of very low ad attribution', () => {
      const rec = MetricsCalculator.generateRecommendation({
        flywheelScore: 60,
        adAttributionPercentage: 5,
        adAttributionTrend: 'stable',
        acos: 20,
        roas: 3,
        dataPoints: 30
      })
      
      expect(rec.action).toBe('reduce_spend')
      expect(rec.spendReduction).toBeGreaterThanOrEqual(50)
      expect(rec.reasoning).toContain('Very low ad dependency')
    })
  })
  
  describe('aggregateByCampaign', () => {
    it('should aggregate metrics by campaign name', () => {
      const data = [
        { campaignName: 'Campaign A', impressions: 1000, clicks: 10, spend: 5, sales: 50, orders: 1 },
        { campaignName: 'Campaign A', impressions: 2000, clicks: 20, spend: 10, sales: 100, orders: 2 },
        { campaignName: 'Campaign B', impressions: 500, clicks: 5, spend: 2.5, sales: 25, orders: 1 }
      ]
      
      const result = MetricsCalculator.aggregateByCampaign(data)
      
      expect(result).toHaveLength(2)
      
      const campaignA = result.find(c => c.campaignName === 'Campaign A')
      expect(campaignA).toBeDefined()
      expect(campaignA!.impressions).toBe(3000)
      expect(campaignA!.clicks).toBe(30)
      expect(campaignA!.spend).toBe(15)
      expect(campaignA!.sales).toBe(150)
      expect(campaignA!.acos).toBe(10) // 15/150 * 100
      
      const campaignB = result.find(c => c.campaignName === 'Campaign B')
      expect(campaignB).toBeDefined()
      expect(campaignB!.impressions).toBe(500)
    })
  })
})