-- Add performance_metrics column to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB;

-- Add index for faster queries on performance metrics
CREATE INDEX IF NOT EXISTS idx_audits_performance_metrics 
ON audits USING GIN (performance_metrics);

-- Add comment explaining the structure
COMMENT ON COLUMN audits.performance_metrics IS 
'Stores calculated performance metrics including account-level, campaign-level, and ad group metrics. Structure: {accountMetrics, campaignMetrics, adGroupMetrics, topPerformers, bottomPerformers}';