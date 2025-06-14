import { describe, it, expect } from 'vitest'
import { CSVParser } from '../csv/parser'

describe('CSV Parsing Debug', () => {
  it('should parse a simple CSV and show validation details', async () => {
    const csvContent = `Date,Campaign Name,Impressions,Clicks,Spend,7 Day Total Sales,7 Day Total Orders (#)
01/01/2024,Test Campaign,1000,50,25.00,200.00,10`

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const parser = new CSVParser()
    const result = await parser.parseFile(file)

    console.log('Validation result:', result.validation)
    console.log('Errors:', result.validation.errors)
    console.log('Warnings:', result.validation.warnings)
    
    if (result.parsedData) {
      console.log('File type detected:', result.parsedData.fileType)
      console.log('Columns:', result.parsedData.columns)
      console.log('First row:', result.parsedData.rows[0])
    }

    // Let's also test what file type detection returns
    const headers = ['Date', 'Campaign Name', 'Impressions', 'Clicks', 'Spend', '7 Day Total Sales', '7 Day Total Orders (#)']
    const fileType = parser.detectFileType(headers)
    console.log('Detected file type:', fileType)
  })
})