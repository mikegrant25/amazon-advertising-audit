import { FileType } from './types'

interface ColumnSchema {
  name: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'percentage' | 'currency'
  alternateNames?: string[]
}

type ReportSchema = {
  [key in FileType]: {
    columns: ColumnSchema[]
    dateFormat: string
    minimumRows: number
  }
}

export const reportSchemas: ReportSchema = {
  sponsored_products: {
    columns: [
      { name: 'Date', required: true, type: 'date' },
      { name: 'Campaign Name', required: true, type: 'string' },
      { name: 'Ad Group Name', required: true, type: 'string' },
      { name: 'Targeting', required: false, type: 'string' },
      { name: 'Match Type', required: false, type: 'string' },
      { name: 'Customer Search Term', required: false, type: 'string' },
      { name: 'Impressions', required: true, type: 'number' },
      { name: 'Clicks', required: true, type: 'number' },
      { name: 'Click-Thru Rate (CTR)', required: true, type: 'percentage', alternateNames: ['CTR'] },
      { name: 'Cost Per Click (CPC)', required: true, type: 'currency', alternateNames: ['CPC'] },
      { name: 'Spend', required: true, type: 'number' },
      { name: '7 Day Total Sales', required: true, type: 'number', alternateNames: ['7 Day Sales', 'Sales'] },
      { name: 'Total Advertising Cost of Sales (ACoS)', required: true, type: 'percentage', alternateNames: ['ACoS'] },
      { name: 'Total Return on Advertising Spend (RoAS)', required: true, type: 'number', alternateNames: ['RoAS'] },
      { name: '7 Day Total Orders (#)', required: true, type: 'number', alternateNames: ['Orders', '7 Day Orders'] },
      { name: '7 Day Total Units (#)', required: true, type: 'number', alternateNames: ['Units', '7 Day Units'] },
      { name: '7 Day Conversion Rate', required: true, type: 'percentage', alternateNames: ['Conversion Rate'] },
      { name: 'Advertised SKU', required: false, type: 'string', alternateNames: ['SKU'] },
      { name: 'Advertised ASIN', required: false, type: 'string', alternateNames: ['ASIN'] }
    ],
    dateFormat: 'MM/DD/YYYY',
    minimumRows: 1
  },
  
  sponsored_brands: {
    columns: [
      { name: 'Date', required: true, type: 'date' },
      { name: 'Campaign Name', required: true, type: 'string' },
      { name: 'Ad Group Name', required: true, type: 'string' },
      { name: 'Targeting', required: false, type: 'string' },
      { name: 'Match Type', required: false, type: 'string' },
      { name: 'Customer Search Term', required: false, type: 'string' },
      { name: 'Impressions', required: true, type: 'number' },
      { name: 'Clicks', required: true, type: 'number' },
      { name: 'Click-Thru Rate (CTR)', required: true, type: 'percentage', alternateNames: ['CTR'] },
      { name: 'Cost Per Click (CPC)', required: true, type: 'currency', alternateNames: ['CPC'] },
      { name: 'Spend', required: true, type: 'number' },
      { name: '14 Day Total Sales', required: true, type: 'number', alternateNames: ['14 Day Sales', 'Sales'] },
      { name: 'Total Advertising Cost of Sales (ACoS)', required: true, type: 'percentage', alternateNames: ['ACoS'] },
      { name: 'Total Return on Advertising Spend (RoAS)', required: true, type: 'number', alternateNames: ['RoAS'] },
      { name: '14 Day Total Orders (#)', required: true, type: 'number', alternateNames: ['Orders', '14 Day Orders'] },
      { name: '14 Day Total Units (#)', required: true, type: 'number', alternateNames: ['Units', '14 Day Units'] },
      { name: '14 Day Conversion Rate', required: true, type: 'percentage', alternateNames: ['Conversion Rate'] }
    ],
    dateFormat: 'MM/DD/YYYY',
    minimumRows: 1
  },
  
  sponsored_display: {
    columns: [
      { name: 'Date', required: true, type: 'date' },
      { name: 'Campaign Name', required: true, type: 'string' },
      { name: 'Ad Group Name', required: true, type: 'string' },
      { name: 'Targeting', required: false, type: 'string' },
      { name: 'Impressions', required: true, type: 'number' },
      { name: 'Clicks', required: true, type: 'number' },
      { name: 'Click-Thru Rate (CTR)', required: true, type: 'percentage', alternateNames: ['CTR'] },
      { name: 'Cost Per Click (CPC)', required: true, type: 'currency', alternateNames: ['CPC'] },
      { name: 'Spend', required: true, type: 'number' },
      { name: '14 Day Total Sales', required: true, type: 'number', alternateNames: ['14 Day Sales', 'Sales'] },
      { name: 'Total Advertising Cost of Sales (ACoS)', required: true, type: 'percentage', alternateNames: ['ACoS'] },
      { name: 'Total Return on Advertising Spend (RoAS)', required: true, type: 'number', alternateNames: ['RoAS'] },
      { name: '14 Day Total Orders (#)', required: true, type: 'number', alternateNames: ['Orders', '14 Day Orders'] },
      { name: '14 Day Total Units (#)', required: true, type: 'number', alternateNames: ['Units', '14 Day Units'] },
      { name: '14 Day Conversion Rate', required: true, type: 'percentage', alternateNames: ['Conversion Rate'] },
      { name: 'Advertised ASIN', required: false, type: 'string', alternateNames: ['ASIN'] }
    ],
    dateFormat: 'MM/DD/YYYY',
    minimumRows: 1
  },
  
  search_terms: {
    columns: [
      { name: 'Date', required: true, type: 'date' },
      { name: 'Campaign Name', required: true, type: 'string' },
      { name: 'Ad Group Name', required: true, type: 'string' },
      { name: 'Customer Search Term', required: true, type: 'string', alternateNames: ['Search Term'] },
      { name: 'Impressions', required: true, type: 'number' },
      { name: 'Clicks', required: true, type: 'number' },
      { name: 'Click-Thru Rate (CTR)', required: true, type: 'percentage', alternateNames: ['CTR'] },
      { name: 'Cost Per Click (CPC)', required: true, type: 'currency', alternateNames: ['CPC'] },
      { name: 'Spend', required: true, type: 'number' },
      { name: '7 Day Total Sales', required: true, type: 'number', alternateNames: ['7 Day Sales', 'Sales'] },
      { name: 'Total Advertising Cost of Sales (ACoS)', required: true, type: 'percentage', alternateNames: ['ACoS'] },
      { name: 'Total Return on Advertising Spend (RoAS)', required: true, type: 'number', alternateNames: ['RoAS'] },
      { name: '7 Day Total Orders (#)', required: true, type: 'number', alternateNames: ['Orders', '7 Day Orders'] },
      { name: '7 Day Total Units (#)', required: true, type: 'number', alternateNames: ['Units', '7 Day Units'] },
      { name: '7 Day Conversion Rate', required: true, type: 'percentage', alternateNames: ['Conversion Rate'] }
    ],
    dateFormat: 'MM/DD/YYYY',
    minimumRows: 1
  },
  
  business_report: {
    columns: [
      { name: 'Date', required: true, type: 'date' },
      { name: 'Parent ASIN', required: false, type: 'string' },
      { name: 'Child ASIN', required: true, type: 'string', alternateNames: ['ASIN'] },
      { name: 'Title', required: true, type: 'string', alternateNames: ['Product Title'] },
      { name: 'SKU', required: true, type: 'string' },
      { name: 'Sessions', required: true, type: 'number' },
      { name: 'Session Percentage', required: true, type: 'percentage' },
      { name: 'Page Views', required: true, type: 'number' },
      { name: 'Page Views Percentage', required: true, type: 'percentage' },
      { name: 'Buy Box Percentage', required: true, type: 'percentage' },
      { name: 'Units Ordered', required: true, type: 'number' },
      { name: 'Units Ordered - B2B', required: false, type: 'number' },
      { name: 'Unit Session Percentage', required: true, type: 'percentage' },
      { name: 'Unit Session Percentage - B2B', required: false, type: 'percentage' },
      { name: 'Ordered Product Sales', required: true, type: 'currency' },
      { name: 'Ordered Product Sales - B2B', required: false, type: 'currency' },
      { name: 'Total Order Items', required: true, type: 'number' },
      { name: 'Total Order Items - B2B', required: false, type: 'number' }
    ],
    dateFormat: 'MM/DD/YYYY',
    minimumRows: 1
  }
}

export function getSchemaForFileType(fileType: FileType) {
  return reportSchemas[fileType]
}

export function findColumnMatch(headers: string[], columnSchema: ColumnSchema): string | null {
  // Check exact match first
  if (headers.includes(columnSchema.name)) {
    return columnSchema.name
  }
  
  // Check alternate names
  if (columnSchema.alternateNames) {
    for (const altName of columnSchema.alternateNames) {
      if (headers.includes(altName)) {
        return altName
      }
    }
  }
  
  // Check case-insensitive match
  const lowerName = columnSchema.name.toLowerCase()
  const found = headers.find(h => h.toLowerCase() === lowerName)
  if (found) {
    return found
  }
  
  // Check case-insensitive alternate names
  if (columnSchema.alternateNames) {
    for (const altName of columnSchema.alternateNames) {
      const lowerAlt = altName.toLowerCase()
      const found = headers.find(h => h.toLowerCase() === lowerAlt)
      if (found) {
        return found
      }
    }
  }
  
  return null
}