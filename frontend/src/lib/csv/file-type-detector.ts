import { FileType } from './types'

/**
 * Detect file type from CSV headers
 */
export function detectFileTypeFromHeaders(headers: string[]): FileType | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
  
  // Check for business report specific columns
  if (normalizedHeaders.includes('units ordered') || 
      normalizedHeaders.includes('ordered product sales') ||
      normalizedHeaders.includes('sessions')) {
    return 'business_report'
  }
  
  // Check for search terms report
  if (normalizedHeaders.includes('customer search term') || 
      normalizedHeaders.includes('search term')) {
    return 'search_terms'
  }
  
  // Check for sponsored display
  if (normalizedHeaders.includes('tactic') || 
      normalizedHeaders.includes('targeting expression')) {
    return 'sponsored_display'
  }
  
  // Check for sponsored brands
  if (normalizedHeaders.includes('video completes') || 
      normalizedHeaders.includes('video first quartile')) {
    return 'sponsored_brands'
  }
  
  // Default to sponsored products if it has basic advertising columns
  if (normalizedHeaders.includes('impressions') && 
      normalizedHeaders.includes('clicks') && 
      normalizedHeaders.includes('spend')) {
    return 'sponsored_products'
  }
  
  return null
}

/**
 * Parse CSV and detect file type automatically
 */
export async function parseWithAutoDetect(file: File) {
  const { CSVParser } = await import('./parser')
  
  // First, peek at headers to detect type
  const text = await file.slice(0, 1024).text() // Read first 1KB
  const firstLine = text.split('\n')[0]
  const headers = firstLine.split(',').map(h => h.trim())
  
  const detectedType = detectFileTypeFromHeaders(headers)
  
  if (!detectedType) {
    return {
      parsedData: null,
      validation: {
        isValid: false,
        errors: [{
          message: 'Unable to detect file type from headers',
          severity: 'error' as const
        }],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          columns: headers
        }
      }
    }
  }
  
  const parser = new CSVParser(detectedType)
  const result = await parser.parseFile(file)
  
  // Add detected file type to parsed data
  if (result.parsedData) {
    return {
      ...result,
      parsedData: {
        ...result.parsedData,
        fileType: detectedType,
        columns: headers,
        rows: result.parsedData.data
      }
    }
  }
  
  return result
}