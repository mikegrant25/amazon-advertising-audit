-- Pilot feedback table
CREATE TABLE IF NOT EXISTS pilot_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature', 'general')) NOT NULL,
  audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes for querying
  INDEX idx_pilot_feedback_user_id (user_id),
  INDEX idx_pilot_feedback_type (feedback_type),
  INDEX idx_pilot_feedback_created_at (created_at DESC)
);

-- Pilot analytics events table
CREATE TABLE IF NOT EXISTS pilot_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes for analytics queries
  INDEX idx_pilot_analytics_user_id (user_id),
  INDEX idx_pilot_analytics_event_name (event_name),
  INDEX idx_pilot_analytics_created_at (created_at DESC)
);

-- Enable RLS
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for pilot_feedback
CREATE POLICY "Users can create their own feedback" ON pilot_feedback
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view their own feedback" ON pilot_feedback
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- RLS policies for pilot_analytics
CREATE POLICY "Users can create their own analytics events" ON pilot_analytics
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Analytics should be write-only for users (they can't read back)
-- Admin/service role can read all for analysis

-- Grant permissions
GRANT INSERT ON pilot_feedback TO authenticated;
GRANT SELECT ON pilot_feedback TO authenticated;
GRANT INSERT ON pilot_analytics TO authenticated;

-- Create views for pilot metrics
CREATE OR REPLACE VIEW pilot_metrics AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN event_name = 'first_login' THEN user_id END) as users_logged_in,
  COUNT(DISTINCT CASE WHEN event_name = 'audit_created' THEN user_id END) as users_created_audit,
  COUNT(DISTINCT CASE WHEN event_name = 'analysis_completed' THEN user_id END) as users_completed_analysis,
  COUNT(DISTINCT CASE WHEN event_name = 'pdf_downloaded' THEN user_id END) as users_downloaded_pdf,
  COUNT(CASE WHEN event_name = 'audit_created' THEN 1 END) as total_audits,
  COUNT(CASE WHEN event_name = 'pdf_downloaded' THEN 1 END) as total_downloads,
  COUNT(CASE WHEN event_name = 'feedback_submitted' THEN 1 END) as total_feedback
FROM pilot_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Create function to get user journey funnel
CREATE OR REPLACE FUNCTION get_pilot_funnel()
RETURNS TABLE (
  step TEXT,
  user_count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'pilot_signup') as signed_up,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'first_login') as logged_in,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'audit_created') as created_audit,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'file_uploaded') as uploaded_files,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'goal_selected') as selected_goal,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'analysis_completed') as completed_analysis,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'pdf_downloaded') as downloaded_pdf
    FROM pilot_analytics
  )
  SELECT 'Signed Up' as step, signed_up as user_count, 100.0 as percentage FROM funnel_data
  UNION ALL
  SELECT 'Logged In', logged_in, ROUND(logged_in::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Created Audit', created_audit, ROUND(created_audit::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Uploaded Files', uploaded_files, ROUND(uploaded_files::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Selected Goal', selected_goal, ROUND(selected_goal::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Completed Analysis', completed_analysis, ROUND(completed_analysis::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Downloaded PDF', downloaded_pdf, ROUND(downloaded_pdf::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data;
END;
$$ LANGUAGE plpgsql;