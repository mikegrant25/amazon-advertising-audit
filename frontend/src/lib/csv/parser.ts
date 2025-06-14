import Papa from 'papaparse'
import { 
  FileType, 
  ValidationError, 
  ValidationResult, 
  ParsedData,
  ReportRow 
} from './types'
import { getSchemaForFileType, findColumnMatch } from './schemas'

export class CSVParser {
  private fileType: FileType
  
  constructor(fileType: FileType) {
    this.fileType = fileType
  }
  
  async parseFile(file: File): Promise<{ 
    parsedData: ParsedData<ReportRow> | null
    validation: ValidationResult 
  }> {
    try {
      // Parse CSV file
      const result = await this.parseCSV(file)
      
      if (!result) {
        return {
          parsedData: null,
          validation: {
            isValid: false,
            errors: [{ message: 'Failed to parse CSV file', severity: 'error' }],
            warnings: [],
            stats: {
              totalRows: 0,
              validRows: 0,
              invalidRows: 0,
              columns: []
            }
          }
        }
      }
      
      // Validate the parsed data
      const validation = this.validateData(result)
      
      return {
        parsedData: validation.isValid ? result : null,
        validation
      }
    } catch (error) {
      return {
        parsedData: null,
        validation: {
          isValid: false,
          errors: [{
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            severity: 'error'
          }],
          warnings: [],
          stats: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            columns: []
          }
        }
      }
    }
  }
  
  private parseCSV(file: File): Promise<ParsedData<ReportRow> | null> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => {
          if (typeof value === 'string') {
            return value.trim()
          }
          return value
        },
        complete: (results) => {
          resolve({
            data: results.data as ReportRow[],
            meta: {
              fields: results.meta.fields || [],
              delimiter: results.meta.delimiter,
              linebreak: results.meta.linebreak,
              aborted: results.meta.aborted,
              truncated: results.meta.truncated || false
            },
            errors: results.errors
          })
        },
        error: (error) => {
          console.error('Papa Parse error:', error)
          resolve(null)
        }
      })
    })
  }
  
  private validateData(parsedData: ParsedData<ReportRow>): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const schema = getSchemaForFileType(this.fileType)
    
    // Check if we have data
    if (!parsedData.data || parsedData.data.length === 0) {
      errors.push({
        message: 'CSV file is empty or contains no data rows',
        severity: 'error'
      })
      
      return {
        isValid: false,
        errors,
        warnings,
        stats: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          columns: parsedData.meta.fields || []
        }
      }
    }
    
    // Check minimum rows
    if (parsedData.data.length < schema.minimumRows) {
      errors.push({
        message: `File must contain at least ${schema.minimumRows} data rows`,
        severity: 'error'
      })
    }
    
    // Validate headers
    const headers = parsedData.meta.fields || []
    const missingRequired: string[] = []
    const columnMapping: Record<string, string> = {}
    
    for (const column of schema.columns) {
      const matchedHeader = findColumnMatch(headers, column)
      
      if (matchedHeader) {
        columnMapping[column.name] = matchedHeader
      } else if (column.required) {
        missingRequired.push(column.name)
      }
    }
    
    if (missingRequired.length > 0) {
      errors.push({
        message: `Missing required columns: ${missingRequired.join(', ')}`,
        severity: 'error'
      })
    }
    
    // Validate each row
    let validRows = 0
    let invalidRows = 0
    
    parsedData.data.forEach((row, index) => {
      const rowErrors = this.validateRow(row, index + 2, columnMapping, schema.columns) // +2 for header and 0-index
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors.filter(e => e.severity === 'error'))
        warnings.push(...rowErrors.filter(e => e.severity === 'warning'))
        invalidRows++
      } else {
        validRows++
      }
    })
    
    // Add parsing errors from Papa Parse
    if (parsedData.errors && parsedData.errors.length > 0) {
      parsedData.errors.forEach((error) => {
        errors.push({
          row: error.row,
          message: error.message,
          severity: 'error'
        })
      })
    }
    
    const isValid = errors.length === 0
    
    return {
      isValid,
      errors,
      warnings,
      stats: {
        totalRows: parsedData.data.length,
        validRows,
        invalidRows,
        columns: headers
      }
    }
  }
  
  private validateRow(
    row: any, 
    rowNumber: number, 
    columnMapping: Record<string, string>,
    schemas: any[]
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    for (const schema of schemas) {
      if (!schema.required) continue
      
      const mappedColumn = columnMapping[schema.name]
      if (!mappedColumn) continue
      
      const value = row[mappedColumn]
      
      // Check if required field is empty
      if (value === null || value === undefined || value === '') {
        errors.push({
          row: rowNumber,
          column: schema.name,
          message: `Missing required value for ${schema.name}`,
          severity: 'error'
        })
        continue
      }
      
      // Validate data types
      const typeError = this.validateDataType(value, schema.type, schema.name)
      if (typeError) {
        errors.push({
          row: rowNumber,
          column: schema.name,
          message: typeError,
          severity: 'error'
        })
      }
    }
    
    return errors
  }
  
  private validateDataType(value: any, type: string, columnName: string): string | null {
    switch (type) {
      case 'number':
        if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/[,$]/g, ''))
          if (isNaN(parsed)) {
            return `Invalid number format in ${columnName}: "${value}"`
          }
        } else if (typeof value !== 'number') {
          return `Expected number in ${columnName}, got ${typeof value}`
        }
        break
        
      case 'percentage':
        if (typeof value === 'string') {
          const cleaned = value.replace('%', '').trim()
          const parsed = parseFloat(cleaned)
          if (isNaN(parsed)) {
            return `Invalid percentage format in ${columnName}: "${value}"`
          }
        } else if (typeof value !== 'number') {
          return `Expected percentage in ${columnName}, got ${typeof value}`
        }
        break
        
      case 'currency':
        if (typeof value === 'string') {
          const cleaned = value.replace(/[$,]/g, '').trim()
          const parsed = parseFloat(cleaned)
          if (isNaN(parsed)) {
            return `Invalid currency format in ${columnName}: "${value}"`
          }
        } else if (typeof value !== 'number') {
          return `Expected currency amount in ${columnName}, got ${typeof value}`
        }
        break
        
      case 'date':
        // Basic date validation - could be enhanced
        if (typeof value !== 'string' || !value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          return `Invalid date format in ${columnName}: "${value}" (expected MM/DD/YYYY)`
        }
        break
        
      case 'string':
        if (typeof value !== 'string' && value !== null && value !== undefined) {
          return `Expected string in ${columnName}, got ${typeof value}`
        }
        break
    }
    
    return null
  }
  
  static detectFileType(headers: string[]): FileType | null {
    // Simple heuristic to detect file type based on unique columns
    const headerSet = new Set(headers.map(h => h.toLowerCase()))
    
    if (headerSet.has('child asin') || headerSet.has('buy box percentage')) {
      return 'business_report'
    }
    
    if (headerSet.has('customer search term')) {
      if (headerSet.has('14 day total sales')) {
        return 'sponsored_brands'
      }
      return 'search_terms'
    }
    
    if (headerSet.has('14 day total sales') && headerSet.has('advertised asin')) {
      return 'sponsored_display'
    }
    
    if (headerSet.has('7 day total sales') && headerSet.has('advertised asin')) {
      return 'sponsored_products'
    }
    
    return null
  }
}