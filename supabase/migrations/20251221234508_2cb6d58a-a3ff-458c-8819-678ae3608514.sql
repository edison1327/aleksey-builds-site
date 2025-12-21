-- Enable realtime for contact_messages table
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;