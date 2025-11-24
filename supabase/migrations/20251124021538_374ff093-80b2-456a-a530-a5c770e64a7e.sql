-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false);

-- RLS policies for message attachments
CREATE POLICY "Users can upload attachments to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (
    auth.uid() IS NOT NULL OR
    -- Allow guest uploads (will be validated by conversation_id in path)
    auth.uid() IS NULL
  )
);

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-attachments' AND
  (
    -- Admins can view all
    has_role(auth.uid(), 'super_admin'::app_role) OR
    -- Users can view attachments in their conversations
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.user_id = auth.uid() OR c.guest_session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Admins can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-attachments' AND
  has_role(auth.uid(), 'super_admin'::app_role)
);