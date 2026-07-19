
CREATE OR REPLACE FUNCTION public.reservation_apply_consume()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'consumed' AND (OLD.status IS DISTINCT FROM 'consumed') THEN
    INSERT INTO public.stock_movements (stock_item_id, movement_type, quantity, notes, work_order_id, created_by)
    VALUES (NEW.stock_item_id, 'consume', NEW.quantity, 'OT reservation consumed', NEW.work_order_id, NEW.requested_by);
    NEW.consumed_at := now();
  END IF;
  RETURN NEW;
END; $$;
