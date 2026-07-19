
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS framework_agreement_id UUID REFERENCES public.framework_agreements(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS framework_agreement_item_id UUID REFERENCES public.framework_agreement_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_po_fa ON public.purchase_orders(framework_agreement_id);
CREATE INDEX IF NOT EXISTS idx_poi_fai ON public.purchase_order_items(framework_agreement_item_id);
