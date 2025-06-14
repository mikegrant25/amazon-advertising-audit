-- Add parsed_data column to audit_files table
ALTER TABLE audit_files 
ADD COLUMN IF NOT EXISTS parsed_data JSONB;

-- Add index for faster queries on parsed data
CREATE INDEX IF NOT EXISTS idx_audit_files_parsed_data 
ON audit_files USING GIN (parsed_data);

-- Add comment explaining the structure
COMMENT ON COLUMN audit_files.parsed_data IS 
'Stores parsed CSV data in a structured format. Structure: {columns: string[], rows: object[], stats: {totalRows, validRows, invalidRows}}';