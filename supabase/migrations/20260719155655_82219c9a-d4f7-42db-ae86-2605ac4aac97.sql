
-- Add cost tracking fields to work_orders
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS actual_cost numeric;

-- Notify admins on booking status changes
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_admins(
      'booking_status',
      'Reserva actualizada: ' || COALESCE(NEW.status, ''),
      COALESCE(NEW.customer_name, 'Cliente') || ' — ' || NEW.start_date::text || ' → ' || NEW.end_date::text,
      '/admin#calendar',
      jsonb_build_object('booking_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_booking_status_notify ON public.equipment_bookings;
CREATE TRIGGER trg_booking_status_notify
AFTER UPDATE ON public.equipment_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();

-- Notify admins on work order status changes
CREATE OR REPLACE FUNCTION public.notify_work_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_admins(
      'work_order',
      'Nueva OT: ' || NEW.code,
      NEW.title || COALESCE(' — ' || NEW.customer_name, ''),
      '/admin#workorders',
      jsonb_build_object('work_order_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_admins(
      'work_order_status',
      'OT ' || NEW.code || ': ' || NEW.status,
      NEW.title,
      '/admin#workorders',
      jsonb_build_object('work_order_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_wo_change_notify ON public.work_orders;
CREATE TRIGGER trg_wo_change_notify
AFTER INSERT OR UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.notify_work_order_change();
