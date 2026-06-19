
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Allow customers to view their own messages
DROP POLICY IF EXISTS "Users can view their own contact messages" ON public.contact_messages;
CREATE POLICY "Users can view their own contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- daily_rate columns for live quote calculator
ALTER TABLE public.machinery ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(10,2);
ALTER TABLE public.vehicles  ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(10,2);
