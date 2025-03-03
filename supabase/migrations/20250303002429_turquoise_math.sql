-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'Ticket Attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for ticket attachments bucket
CREATE POLICY "Ticket attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] = 'tickets'
);

CREATE POLICY "Users can update their own ticket attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] = 'tickets'
);

CREATE POLICY "Users can delete their own ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] = 'tickets'
);