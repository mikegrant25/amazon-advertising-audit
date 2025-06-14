-- Add recommendations columns to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS recommendations_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audits_recommendations_generated_at 
ON audits(recommendations_generated_at) 
WHERE recommendations_generated_at IS NOT NULL;