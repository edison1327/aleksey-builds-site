
-- Allow authenticated customers to view their own invoices, contracts and work orders by email
CREATE POLICY "Customers view own invoices"
ON public.invoices FOR SELECT TO authenticated
USING (lower(customer_email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Customers view own contracts"
ON public.contracts FOR SELECT TO authenticated
USING (lower(customer_email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Customers view own work orders by email"
ON public.work_orders FOR SELECT TO authenticated
USING (lower(customer_email) = lower((auth.jwt() ->> 'email')));
