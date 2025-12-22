-- Add is_read column to contact_messages table
ALTER TABLE public.contact_messages 
ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Create index for faster queries on unread messages
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages(is_read);

-- Set existing responded messages as read
UPDATE public.contact_messages SET is_read = true WHERE status = 'responded';