import { describe, it, expect, beforeEach } from 'vitest'
import { CSVParser } from '../parser'

describe('CSVParser', () => {
  describe('parseFile', () => {
    it('should successfully parse a valid sponsored products CSV', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,Campaign 1,Ad Group 1,1000,50,5.00%,$1.50,75.00,500.00,15.00%,6.67,10,15,20.00%`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.errors).toHaveLength(0)
      expect(result.validation.stats.totalRows).toBe(1)
      expect(result.validation.stats.validRows).toBe(1)
      expect(result.parsedData).not.toBeNull()
      expect(result.parsedData?.data).toHaveLength(1)
    })

    it('should detect missing required columns', async () => {
      const csvContent = `Date,Campaign Name,Impressions
01/01/2024,Campaign 1,1000`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.errors.length).toBeGreaterThan(0)
      expect(result.validation.errors[0].message).toContain('Missing required columns')
    })

    it('should validate data types correctly', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,Campaign 1,Ad Group 1,not-a-number,50,5.00%,$1.50,75.00,500.00,15.00%,6.67,10,15,20.00%`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.errors.some(e => e.message.includes('Invalid number format'))).toBe(true)
    })

    it('should handle empty CSV files', async () => {
      const csvContent = ''
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.errors[0].message).toContain('empty')
    })

    it('should handle CSV with only headers', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.errors[0].message).toContain('empty or contains no data rows')
    })

    it('should handle different date formats', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
2024-01-01,Campaign 1,Ad Group 1,1000,50,5.00%,$1.50,75.00,500.00,15.00%,6.67,10,15,20.00%`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.errors.some(e => e.message.includes('Invalid date format'))).toBe(true)
    })

    it('should handle currency values with different formats', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,Campaign 1,Ad Group 1,1000,50,5.00%,1.50,75.00,500.00,15.00%,6.67,10,15,20.00%`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.errors).toHaveLength(0)
    })

    it('should handle percentage values without % symbol', async () => {
      const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,Campaign 1,Ad Group 1,1000,50,5.00,$1.50,75.00,500.00,15.00,6.67,10,15,20.00`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const parser = new CSVParser('sponsored_products')
      
      const result = await parser.parseFile(file)
      
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.errors).toHaveLength(0)
    })
  })

  describe('detectFileType', () => {
    it('should detect business report by unique columns', () => {
      const headers = ['Date', 'Child ASIN', 'Buy Box Percentage', 'Sessions']
      const fileType = CSVParser.detectFileType(headers)
      expect(fileType).toBe('business_report')
    })

    it('should detect sponsored products by 7 day sales', () => {
      const headers = ['Date', '7 Day Total Sales', 'Advertised ASIN', 'Clicks']
      const fileType = CSVParser.detectFileType(headers)
      expect(fileType).toBe('sponsored_products')
    })

    it('should detect sponsored brands by 14 day sales', () => {
      const headers = ['Date', '14 Day Total Sales', 'Customer Search Term', 'Clicks']
      const fileType = CSVParser.detectFileType(headers)
      expect(fileType).toBe('sponsored_brands')
    })

    it('should detect search terms report', () => {
      const headers = ['Date', 'Customer Search Term', '7 Day Total Sales', 'Clicks']
      const fileType = CSVParser.detectFileType(headers)
      expect(fileType).toBe('search_terms')
    })

    it('should return null for unknown file type', () => {
      const headers = ['Random', 'Headers', 'That', 'Dont', 'Match']
      const fileType = CSVParser.detectFileType(headers)
      expect(fileType).toBeNull()
    })
  })
})

describe('CSV Validation Edge Cases', () => {
  it('should handle rows with missing optional fields', async () => {
    const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate,Advertised ASIN
01/01/2024,Campaign 1,Ad Group 1,1000,50,5.00%,$1.50,75.00,500.00,15.00%,6.67,10,15,20.00%,`
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const parser = new CSVParser('sponsored_products')
    
    const result = await parser.parseFile(file)
    
    expect(result.validation.isValid).toBe(true)
    expect(result.validation.errors).toHaveLength(0)
  })

  it('should handle extra columns not in schema', async () => {
    const csvContent = `Date,Campaign Name,Ad Group Name,Extra Column,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,Campaign 1,Ad Group 1,Extra Data,1000,50,5.00%,$1.50,75.00,500.00,15.00%,6.67,10,15,20.00%`
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const parser = new CSVParser('sponsored_products')
    
    const result = await parser.parseFile(file)
    
    expect(result.validation.isValid).toBe(true)
    expect(result.validation.errors).toHaveLength(0)
  })

  it('should trim whitespace from values', async () => {
    const csvContent = `Date,Campaign Name,Ad Group Name,Impressions,Clicks,Click-Thru Rate (CTR),Cost Per Click (CPC),Spend,7 Day Total Sales,Total Advertising Cost of Sales (ACoS),Total Return on Advertising Spend (RoAS),7 Day Total Orders (#),7 Day Total Units (#),7 Day Conversion Rate
01/01/2024,  Campaign 1  ,  Ad Group 1  ,  1000  ,  50  ,  5.00%  ,  $1.50  ,  75.00  ,  500.00  ,  15.00%  ,  6.67  ,  10  ,  15  ,  20.00%  `
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const parser = new CSVParser('sponsored_products')
    
    const result = await parser.parseFile(file)
    
    expect(result.validation.isValid).toBe(true)
    expect((result.parsedData?.data[0] as any)['Campaign Name']).toBe('Campaign 1')
  })
})