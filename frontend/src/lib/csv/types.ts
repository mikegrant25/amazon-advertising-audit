export type FileType = 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'

export interface ValidationError {
  row?: number
  column?: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
    columns: string[]
  }
}

export interface ParsedData<T = any> {
  data: T[]
  meta: {
    fields: string[]
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
  }
  errors: any[]
}

// Sponsored Products Report columns
export interface SponsoredProductsRow {
  Date: string
  'Campaign Name': string
  'Ad Group Name': string
  'Targeting': string
  'Match Type': string
  'Customer Search Term': string
  'Impressions': number
  'Clicks': number
  'Click-Thru Rate (CTR)': string
  'Cost Per Click (CPC)': string
  'Spend': number
  '7 Day Total Sales': number
  'Total Advertising Cost of Sales (ACoS)': string
  'Total Return on Advertising Spend (RoAS)': string
  '7 Day Total Orders (#)': number
  '7 Day Total Units (#)': number
  '7 Day Conversion Rate': string
  'Advertised SKU': string
  'Advertised ASIN': string
}

// Sponsored Brands Report columns
export interface SponsoredBrandsRow {
  Date: string
  'Campaign Name': string
  'Ad Group Name': string
  'Targeting': string
  'Match Type': string
  'Customer Search Term': string
  'Impressions': number
  'Clicks': number
  'Click-Thru Rate (CTR)': string
  'Cost Per Click (CPC)': string
  'Spend': number
  '14 Day Total Sales': number
  'Total Advertising Cost of Sales (ACoS)': string
  'Total Return on Advertising Spend (RoAS)': string
  '14 Day Total Orders (#)': number
  '14 Day Total Units (#)': number
  '14 Day Conversion Rate': string
}

// Sponsored Display Report columns
export interface SponsoredDisplayRow {
  Date: string
  'Campaign Name': string
  'Ad Group Name': string
  'Targeting': string
  'Impressions': number
  'Clicks': number
  'Click-Thru Rate (CTR)': string
  'Cost Per Click (CPC)': string
  'Spend': number
  '14 Day Total Sales': number
  'Total Advertising Cost of Sales (ACoS)': string
  'Total Return on Advertising Spend (RoAS)': string
  '14 Day Total Orders (#)': number
  '14 Day Total Units (#)': number
  '14 Day Conversion Rate': string
  'Advertised ASIN': string
}

// Search Terms Report columns (simplified)
export interface SearchTermsRow {
  Date: string
  'Campaign Name': string
  'Ad Group Name': string
  'Customer Search Term': string
  'Impressions': number
  'Clicks': number
  'Click-Thru Rate (CTR)': string
  'Cost Per Click (CPC)': string
  'Spend': number
  '7 Day Total Sales': number
  'Total Advertising Cost of Sales (ACoS)': string
  'Total Return on Advertising Spend (RoAS)': string
  '7 Day Total Orders (#)': number
  '7 Day Total Units (#)': number
  '7 Day Conversion Rate': string
}

// Business Report columns
export interface BusinessReportRow {
  Date: string
  'Parent ASIN': string
  'Child ASIN': string
  'Title': string
  'SKU': string
  'Sessions': number
  'Session Percentage': string
  'Page Views': number
  'Page Views Percentage': string
  'Buy Box Percentage': string
  'Units Ordered': number
  'Units Ordered - B2B': number
  'Unit Session Percentage': string
  'Unit Session Percentage - B2B': string
  'Ordered Product Sales': number
  'Ordered Product Sales - B2B': number
  'Total Order Items': number
  'Total Order Items - B2B': number
}

export type ReportRow = 
  | SponsoredProductsRow 
  | SponsoredBrandsRow 
  | SponsoredDisplayRow 
  | SearchTermsRow 
  | BusinessReportRow