-- Create storage bucket for device images
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-images', 'Device Images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for device images bucket
CREATE POLICY "Device images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'device-images');

CREATE POLICY "Users can upload device images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'device-images' AND
  (storage.foldername(name))[1] = 'devices'
);

CREATE POLICY "Users can update their own device images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'device-images' AND
  (storage.foldername(name))[1] = 'devices'
);

CREATE POLICY "Users can delete their own device images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'device-images' AND
  (storage.foldername(name))[1] = 'devices'
);