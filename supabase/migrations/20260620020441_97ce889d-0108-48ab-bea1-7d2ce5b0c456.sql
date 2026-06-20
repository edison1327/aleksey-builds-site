
ALTER TABLE public.message_replies ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Restrict customer access to non-internal replies only
DROP POLICY IF EXISTS "Customers view replies on their own messages" ON public.message_replies;
CREATE POLICY "Customers view replies on their own messages"
ON public.message_replies FOR SELECT
USING (
  is_internal = false
  AND EXISTS (
    SELECT 1 FROM public.contact_messages cm
    WHERE cm.id = message_replies.message_id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers reply to their own messages" ON public.message_replies;
CREATE POLICY "Customers reply to their own messages"
ON public.message_replies FOR INSERT
WITH CHECK (
  author_role = 'customer'
  AND author_id = auth.uid()
  AND is_internal = false
  AND EXISTS (
    SELECT 1 FROM public.contact_messages cm
    WHERE cm.id = message_replies.message_id AND cm.user_id = auth.uid()
  )
);
