-- Add analysis_result column to audits table
ALTER TABLE audits 
ADD COLUMN analysis_result jsonb;

-- Create index for performance
CREATE INDEX idx_audits_analysis_result ON audits USING gin (analysis_result);

-- Create asin_metrics table for detailed metrics storage
CREATE TABLE asin_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  asin text NOT NULL,
  metrics jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_asin_metrics_audit_id ON asin_metrics(audit_id);
CREATE INDEX idx_asin_metrics_asin ON asin_metrics(asin);
CREATE INDEX idx_asin_metrics_created_at ON asin_metrics(created_at);

-- Add RLS policies for asin_metrics
ALTER TABLE asin_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see metrics for their own audits
CREATE POLICY "Users can view own asin metrics" ON asin_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- Users can insert metrics for their own audits
CREATE POLICY "Users can insert own asin metrics" ON asin_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- Users can delete their own metrics
CREATE POLICY "Users can delete own asin metrics" ON asin_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );