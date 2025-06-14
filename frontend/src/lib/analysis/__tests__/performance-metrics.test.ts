import { describe, it, expect } from 'vitest'
import { PerformanceMetricsCalculator } from '../performance-metrics'

describe('PerformanceMetricsCalculator', () => {
  describe('calculateCTR', () => {
    it('should calculate CTR correctly', () => {
      expect(PerformanceMetricsCalculator.calculateCTR(50, 1000)).toBe(5)
      expect(PerformanceMetricsCalculator.calculateCTR(25, 500)).toBe(5)
    })

    it('should handle zero impressions', () => {
      expect(PerformanceMetricsCalculator.calculateCTR(0, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateCTR(10, 0)).toBe(0)
    })

    it('should handle decimal results', () => {
      expect(PerformanceMetricsCalculator.calculateCTR(47, 10000)).toBeCloseTo(0.47)
    })
  })

  describe('calculateCVR', () => {
    it('should calculate CVR correctly', () => {
      expect(PerformanceMetricsCalculator.calculateCVR(10, 100)).toBe(10)
      expect(PerformanceMetricsCalculator.calculateCVR(15, 150)).toBe(10)
    })

    it('should handle zero clicks', () => {
      expect(PerformanceMetricsCalculator.calculateCVR(0, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateCVR(5, 0)).toBe(0)
    })

    it('should handle high conversion rates', () => {
      expect(PerformanceMetricsCalculator.calculateCVR(95, 100)).toBe(95)
    })
  })

  describe('calculateACoS', () => {
    it('should calculate ACoS correctly', () => {
      expect(PerformanceMetricsCalculator.calculateACoS(50, 200)).toBe(25)
      expect(PerformanceMetricsCalculator.calculateACoS(100, 100)).toBe(100)
    })

    it('should handle zero revenue', () => {
      expect(PerformanceMetricsCalculator.calculateACoS(0, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateACoS(100, 0)).toBe(999) // Capped
    })

    it('should handle low ACoS values', () => {
      expect(PerformanceMetricsCalculator.calculateACoS(10, 1000)).toBe(1)
    })
  })

  describe('calculateROAS', () => {
    it('should calculate ROAS correctly', () => {
      expect(PerformanceMetricsCalculator.calculateROAS(400, 100)).toBe(4)
      expect(PerformanceMetricsCalculator.calculateROAS(300, 100)).toBe(3)
    })

    it('should handle zero spend', () => {
      expect(PerformanceMetricsCalculator.calculateROAS(0, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateROAS(100, 0)).toBe(0)
    })

    it('should verify ROAS is inverse of ACoS', () => {
      const spend = 100
      const revenue = 400
      const acos = PerformanceMetricsCalculator.calculateACoS(spend, revenue)
      const roas = PerformanceMetricsCalculator.calculateROAS(revenue, spend)
      expect(roas).toBeCloseTo(100 / acos)
    })
  })

  describe('calculateTACoS', () => {
    it('should calculate TACoS correctly', () => {
      expect(PerformanceMetricsCalculator.calculateTACoS(50, 500)).toBe(10)
      expect(PerformanceMetricsCalculator.calculateTACoS(100, 1000)).toBe(10)
    })

    it('should handle zero total sales', () => {
      expect(PerformanceMetricsCalculator.calculateTACoS(0, 0)).toBe(0)
      expect(PerformanceMetricsCalculator.calculateTACoS(100, 0)).toBe(999) // Capped
    })
  })

  describe('calculateCampaignMetrics', () => {
    it('should calculate all metrics for a campaign', () => {
      const data = {
        campaignId: 'camp1',
        campaignName: 'Test Campaign',
        impressions: 10000,
        clicks: 100,
        cost: 50,
        sales: 200,
        orders: 10,
      }

      const metrics = PerformanceMetricsCalculator.calculateCampaignMetrics(data)

      expect(metrics).toEqual({
        ...data,
        ctr: 1, // 100/10000 * 100
        cvr: 10, // 10/100 * 100
        acos: 25, // 50/200 * 100
        roas: 4, // 200/50
      })
    })
  })

  describe('calculateAccountMetrics', () => {
    it('should aggregate metrics across campaigns', () => {
      const campaigns = [
        {
          campaignId: 'camp1',
          campaignName: 'Campaign 1',
          impressions: 10000,
          clicks: 100,
          cost: 50,
          sales: 200,
          orders: 10,
          ctr: 1,
          cvr: 10,
          acos: 25,
          roas: 4,
        },
        {
          campaignId: 'camp2',
          campaignName: 'Campaign 2',
          impressions: 5000,
          clicks: 50,
          cost: 25,
          sales: 100,
          orders: 5,
          ctr: 1,
          cvr: 10,
          acos: 25,
          roas: 4,
        },
      ]

      const accountMetrics = PerformanceMetricsCalculator.calculateAccountMetrics(campaigns)

      expect(accountMetrics).toEqual({
        totalImpressions: 15000,
        totalClicks: 150,
        totalCost: 75,
        totalSales: 300,
        totalOrders: 15,
        avgCtr: 1, // 150/15000 * 100
        avgCvr: 10, // 15/150 * 100
        overallAcos: 25, // 75/300 * 100
        overallRoas: 4, // 300/75
      })
    })

    it('should calculate TACoS when organic sales provided', () => {
      const campaigns = [
        {
          campaignId: 'camp1',
          campaignName: 'Campaign 1',
          impressions: 10000,
          clicks: 100,
          cost: 100,
          sales: 400,
          orders: 10,
          ctr: 1,
          cvr: 10,
          acos: 25,
          roas: 4,
        },
      ]

      const organicSales = 600
      const accountMetrics = PerformanceMetricsCalculator.calculateAccountMetrics(
        campaigns,
        organicSales
      )

      expect(accountMetrics.tacos).toBe(10) // 100/(400+600) * 100
    })
  })

  describe('identifyTopPerformers', () => {
    const campaigns = [
      {
        campaignId: 'camp1',
        campaignName: 'High CTR Campaign',
        impressions: 1000,
        clicks: 20,
        cost: 50,
        sales: 200,
        orders: 10,
        ctr: 2,
        cvr: 50,
        acos: 25,
        roas: 4,
      },
      {
        campaignId: 'camp2',
        campaignName: 'High CVR Campaign',
        impressions: 1000,
        clicks: 10,
        cost: 25,
        sales: 150,
        orders: 8,
        ctr: 1,
        cvr: 80,
        acos: 16.67,
        roas: 6,
      },
      {
        campaignId: 'camp3',
        campaignName: 'High ROAS Campaign',
        impressions: 1000,
        clicks: 15,
        cost: 20,
        sales: 160,
        orders: 6,
        ctr: 1.5,
        cvr: 40,
        acos: 12.5,
        roas: 8,
      },
    ]

    it('should identify top performers by CTR', () => {
      const topPerformers = PerformanceMetricsCalculator.identifyTopPerformers(campaigns, 2)
      expect(topPerformers.byCtr[0].campaignId).toBe('camp1')
      expect(topPerformers.byCtr[1].campaignId).toBe('camp3')
    })

    it('should identify top performers by CVR', () => {
      const topPerformers = PerformanceMetricsCalculator.identifyTopPerformers(campaigns, 2)
      expect(topPerformers.byCvr[0].campaignId).toBe('camp2')
      expect(topPerformers.byCvr[1].campaignId).toBe('camp1')
    })

    it('should identify top performers by ROAS', () => {
      const topPerformers = PerformanceMetricsCalculator.identifyTopPerformers(campaigns, 2)
      expect(topPerformers.byRoas[0].campaignId).toBe('camp3')
      expect(topPerformers.byRoas[1].campaignId).toBe('camp2')
    })
  })

  describe('identifyBottomPerformers', () => {
    const campaigns = [
      {
        campaignId: 'camp1',
        campaignName: 'Low CTR Campaign',
        impressions: 1000,
        clicks: 5,
        cost: 50,
        sales: 100,
        orders: 2,
        ctr: 0.5,
        cvr: 40,
        acos: 50,
        roas: 2,
      },
      {
        campaignId: 'camp2',
        campaignName: 'Low CVR Campaign',
        impressions: 1000,
        clicks: 20,
        cost: 40,
        sales: 80,
        orders: 1,
        ctr: 2,
        cvr: 5,
        acos: 50,
        roas: 2,
      },
      {
        campaignId: 'camp3',
        campaignName: 'High ACoS Campaign',
        impressions: 1000,
        clicks: 15,
        cost: 100,
        sales: 120,
        orders: 3,
        ctr: 1.5,
        cvr: 20,
        acos: 83.33,
        roas: 1.2,
      },
    ]

    it('should identify bottom performers by CTR', () => {
      const bottomPerformers = PerformanceMetricsCalculator.identifyBottomPerformers(campaigns, 2)
      expect(bottomPerformers.byCtr[0].campaignId).toBe('camp1')
      expect(bottomPerformers.byCtr[1].campaignId).toBe('camp3')
    })

    it('should identify bottom performers by CVR', () => {
      const bottomPerformers = PerformanceMetricsCalculator.identifyBottomPerformers(campaigns, 2)
      expect(bottomPerformers.byCvr[0].campaignId).toBe('camp2')
      expect(bottomPerformers.byCvr[1].campaignId).toBe('camp3')
    })

    it('should identify bottom performers by ACoS', () => {
      const bottomPerformers = PerformanceMetricsCalculator.identifyBottomPerformers(campaigns, 2)
      expect(bottomPerformers.byAcos[0].campaignId).toBe('camp3')
      expect(bottomPerformers.byAcos[1].campaignId).toBe('camp1')
    })
  })

  describe('formatMetric', () => {
    it('should format percentages correctly', () => {
      expect(PerformanceMetricsCalculator.formatMetric(25.5, 'percentage')).toBe('25.50%')
      expect(PerformanceMetricsCalculator.formatMetric(0.47, 'percentage')).toBe('0.47%')
    })

    it('should format currency correctly', () => {
      expect(PerformanceMetricsCalculator.formatMetric(100.5, 'currency')).toBe('$100.50')
      expect(PerformanceMetricsCalculator.formatMetric(1000, 'currency')).toBe('$1000.00')
    })

    it('should format ratios correctly', () => {
      expect(PerformanceMetricsCalculator.formatMetric(4.567, 'ratio')).toBe('4.57')
      expect(PerformanceMetricsCalculator.formatMetric(2, 'ratio')).toBe('2.00')
    })
  })

  describe('getPerformanceRating', () => {
    it('should rate CTR performance', () => {
      expect(PerformanceMetricsCalculator.getPerformanceRating('ctr', 0.6)).toBe('excellent')
      expect(PerformanceMetricsCalculator.getPerformanceRating('ctr', 0.4)).toBe('good')
      expect(PerformanceMetricsCalculator.getPerformanceRating('ctr', 0.2)).toBe('average')
      expect(PerformanceMetricsCalculator.getPerformanceRating('ctr', 0.05)).toBe('poor')
    })

    it('should rate CVR performance', () => {
      expect(PerformanceMetricsCalculator.getPerformanceRating('cvr', 20)).toBe('excellent')
      expect(PerformanceMetricsCalculator.getPerformanceRating('cvr', 12)).toBe('good')
      expect(PerformanceMetricsCalculator.getPerformanceRating('cvr', 7)).toBe('average')
      expect(PerformanceMetricsCalculator.getPerformanceRating('cvr', 3)).toBe('poor')
    })

    it('should rate ACoS performance (lower is better)', () => {
      expect(PerformanceMetricsCalculator.getPerformanceRating('acos', 10)).toBe('excellent')
      expect(PerformanceMetricsCalculator.getPerformanceRating('acos', 20)).toBe('good')
      expect(PerformanceMetricsCalculator.getPerformanceRating('acos', 30)).toBe('average')
      expect(PerformanceMetricsCalculator.getPerformanceRating('acos', 50)).toBe('poor')
    })

    it('should rate ROAS performance', () => {
      expect(PerformanceMetricsCalculator.getPerformanceRating('roas', 5)).toBe('excellent')
      expect(PerformanceMetricsCalculator.getPerformanceRating('roas', 3.5)).toBe('good')
      expect(PerformanceMetricsCalculator.getPerformanceRating('roas', 2.5)).toBe('average')
      expect(PerformanceMetricsCalculator.getPerformanceRating('roas', 1)).toBe('poor')
    })
  })
})