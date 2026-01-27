-- Create the audio-recordings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the audio-recordings bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own audio files" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to access all files (for transcription service)
CREATE POLICY "Service role can access all audio files" ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio-recordings')
WITH CHECK (bucket_id = 'audio-recordings');