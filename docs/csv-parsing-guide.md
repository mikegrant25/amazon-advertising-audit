# CSV Parsing and Data Validation Guide

This guide documents the CSV parsing infrastructure implemented in US-001-007.

## Overview

The CSV parsing system validates and processes Amazon advertising report files, ensuring data quality before analysis. It supports all 5 major report types with automatic file type detection, comprehensive validation, and real-time processing feedback.

## Architecture

```
File Upload → Storage → Processing Queue → Parser → Validation → Database
     ↓                                                              ↓
UI Feedback ← Status Updates ← Processing API ← File Status ← Parsed Data
```

## Components

### 1. CSV Parser (`/src/lib/csv/parser.ts`)

The main parsing engine using Papa Parse library.

**Key Features:**
- Automatic file type detection based on column headers
- Streaming support for large files
- Encoding handling
- Comprehensive error reporting

**Usage:**
```typescript
import { CSVParser } from '@/lib/csv/parser'

const parser = new CSVParser('sponsored_products')
const { parsedData, validation } = await parser.parseFile(file)

if (validation.isValid) {
  // Process parsed data
} else {
  // Handle validation errors
  console.error(validation.errors)
}
```

### 2. Validation Schemas (`/src/lib/csv/schemas.ts`)

Defines the expected structure for each report type.

**Supported Report Types:**
- `sponsored_products` - 7-day attribution window
- `sponsored_brands` - 14-day attribution window  
- `sponsored_display` - Display advertising metrics
- `search_terms` - Search term performance
- `business_report` - Organic sales data

**Schema Definition:**
```typescript
{
  columns: [
    {
      name: 'Column Name',
      required: boolean,
      type: 'string' | 'number' | 'date' | 'percentage' | 'currency',
      alternateNames?: string[] // Handle Amazon's column name variations
    }
  ],
  dateFormat: 'MM/DD/YYYY',
  minimumRows: 1
}
```

### 3. File Processor (`/src/lib/csv/processor.ts`)

Handles the complete processing workflow.

**Processing Steps:**
1. Update file status to 'processing'
2. Download file from Supabase storage
3. Parse and validate CSV
4. Store parsed data in batches (1000 rows)
5. Update file status with results
6. Return processing summary

**Queue Management:**
- Single-file processing to prevent memory issues
- Automatic queue handling
- Error recovery

### 4. Processing API (`/src/app/api/files/process/route.ts`)

REST endpoint for triggering file processing.

**Endpoints:**
- `POST /api/files/process` - Start processing
- `GET /api/files/process?fileId=xxx` - Check status

**Response Format:**
```json
{
  "fileId": "uuid",
  "status": "success|warning|error",
  "validation": {
    "isValid": boolean,
    "errors": [],
    "warnings": [],
    "stats": {
      "totalRows": number,
      "validRows": number,
      "invalidRows": number
    }
  }
}
```

### 5. Enhanced Upload UI (`/src/components/audits/file-upload-with-processing.tsx`)

Provides real-time feedback during upload and processing.

**Status States:**
- `idle` - Ready for upload
- `uploading` - File transfer in progress
- `processing` - CSV validation/parsing
- `completed` - Successfully processed
- `warning` - Processed with warnings
- `error` - Processing failed

## Database Schema

### parsed_data Table
```sql
CREATE TABLE parsed_data (
  id uuid PRIMARY KEY,
  file_id uuid REFERENCES audit_files(id),
  file_type text NOT NULL,
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### audit_files Table Updates
```sql
ALTER TABLE audit_files ADD COLUMN
  validation_result jsonb,
  error_message text,
  processed_at timestamptz;
```

## Validation Rules

### Common Validations
- Required columns must be present
- Data types must match schema
- Date format: MM/DD/YYYY
- Numbers can include commas
- Percentages with or without % symbol
- Currency with or without $ symbol

### Report-Specific Validations

**Sponsored Products:**
- Must have 7-day sales metrics
- ASIN or SKU required
- CTR, CPC, ACoS percentages

**Business Report:**
- Sessions and Page Views required
- Buy Box percentage
- Parent/Child ASIN relationship

## Error Handling

### Validation Errors
```typescript
{
  row: 5,
  column: "Impressions",
  message: "Invalid number format: 'not-a-number'",
  severity: "error"
}
```

### Processing Errors
- File download failures
- Parse errors (malformed CSV)
- Database insertion errors
- Timeout errors (>2 minutes)

## Testing

Run the test suite:
```bash
npm test src/lib/csv/__tests__/parser.test.ts
```

**Test Coverage:**
- Valid CSV parsing
- Missing columns detection
- Data type validation
- Empty file handling
- Encoding issues
- Edge cases (extra columns, whitespace)

## Performance Considerations

### File Size Limits
- Maximum: 500MB per file
- Recommended: <100MB for optimal performance

### Processing Times
- Small files (<10MB): ~5 seconds
- Medium files (10-50MB): ~30 seconds
- Large files (50-500MB): 1-3 minutes

### Batch Processing
- Insert rows in batches of 1000
- Prevents timeout errors
- Reduces memory usage

## Usage Example

```typescript
// In your component
import { FileUploadWithProcessing } from '@/components/audits/file-upload-with-processing'

<FileUploadWithProcessing
  auditId={auditId}
  fileType="sponsored_products"
  onUploadComplete={(fileId) => console.log('Uploaded:', fileId)}
  onProcessingComplete={(fileId, status) => {
    if (status === 'success') {
      // File ready for analysis
    }
  }}
  onError={(error) => console.error(error)}
/>
```

## Troubleshooting

### Common Issues

1. **"Missing required columns"**
   - Check column names match schema
   - Look for alternate column names
   - Verify file is correct report type

2. **"Invalid date format"**
   - Ensure dates are MM/DD/YYYY
   - Check for Excel date serial numbers

3. **"Processing timeout"**
   - File may be too large
   - Check network connection
   - Retry with smaller file

### Debug Mode

Enable detailed logging:
```typescript
const parser = new CSVParser('sponsored_products')
// Check console for detailed parse output
```

## Migration Guide

To apply the database changes:

1. **Via Supabase Dashboard:**
   ```sql
   -- Run the migration from:
   -- supabase/migrations/20250114_csv_processing.sql
   ```

2. **Via CLI (if available):**
   ```bash
   supabase db push
   ```

## Security Considerations

- File type validation (CSV only)
- Size limits enforced
- RLS policies on parsed_data
- User can only process their own files
- Sanitized error messages

---

Last Updated: January 14, 2025