/*
  # Add support for image sync service

  1. Schema Updates
    - Add local_path and md5_hash columns to device_images table
    - Create image_sync_logs table to track sync operations

  2. Security
    - Enable RLS on image_sync_logs table
    - Add policies for image_sync_logs table
*/

-- Add columns to device_images table
ALTER TABLE device_images
ADD COLUMN IF NOT EXISTS local_path TEXT,
ADD COLUMN IF NOT EXISTS md5_hash TEXT;

-- Create image_sync_logs table
CREATE TABLE IF NOT EXISTS image_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  device_id UUID REFERENCES devices ON DELETE CASCADE,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  error_message TEXT
);

-- Enable RLS on image_sync_logs table
ALTER TABLE image_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for image_sync_logs table
CREATE POLICY "Users can view their own image sync logs"
  ON image_sync_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image sync logs"
  ON image_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index on device_images for faster lookups
CREATE INDEX IF NOT EXISTS device_images_device_id_idx ON device_images(device_id);
CREATE INDEX IF NOT EXISTS device_images_md5_hash_idx ON device_images(md5_hash);

-- Create function to log image sync operations
CREATE OR REPLACE FUNCTION public.log_image_sync_operation(
  p_user_id UUID,
  p_device_id UUID,
  p_operation TEXT,
  p_status TEXT,
  p_details JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO image_sync_logs (
    user_id,
    device_id,
    operation,
    status,
    details,
    error_message
  ) VALUES (
    p_user_id,
    p_device_id,
    p_operation,
    p_status,
    p_details,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;