-- Add validation_result and error_message columns to audit_files
ALTER TABLE audit_files 
ADD COLUMN validation_result jsonb,
ADD COLUMN error_message text,
ADD COLUMN processed_at timestamptz;

-- Create parsed_data table for storing CSV data
CREATE TABLE parsed_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES audit_files(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_parsed_data_file_id ON parsed_data(file_id);
CREATE INDEX idx_parsed_data_file_type ON parsed_data(file_type);
CREATE INDEX idx_parsed_data_created_at ON parsed_data(created_at);

-- Add RLS policies for parsed_data
ALTER TABLE parsed_data ENABLE ROW LEVEL SECURITY;

-- Users can only see parsed data for their own files
CREATE POLICY "Users can view own parsed data" ON parsed_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );

-- Users can insert parsed data for their own files
CREATE POLICY "Users can insert own parsed data" ON parsed_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );

-- Users can delete their own parsed data
CREATE POLICY "Users can delete own parsed data" ON parsed_data
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );