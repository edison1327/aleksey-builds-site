
DROP POLICY IF EXISTS "Public read for signing" ON public.contracts;
DROP POLICY IF EXISTS "Public sign update" ON public.contracts;
REVOKE SELECT, UPDATE ON public.contracts FROM anon;

CREATE OR REPLACE FUNCTION public.get_contract_by_token(_token text)
RETURNS TABLE (
  id uuid, code text, title text, service_slug text,
  customer_name text, customer_email text, customer_document text, customer_address text,
  amount numeric, currency text, body text, status text,
  sent_at timestamptz, signed_at timestamptz, signature_data_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id, code, title, service_slug, customer_name, customer_email, customer_document,
         customer_address, amount, currency, body, status, sent_at, signed_at, signature_data_url
  FROM public.contracts
  WHERE sign_token = _token AND status IN ('sent','signed')
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_contract_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sign_contract_with_token(
  _token text, _signature_data_url text, _ip text, _ua text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.contracts WHERE sign_token=_token AND status='sent';
  IF _id IS NULL THEN RETURN false; END IF;
  UPDATE public.contracts
    SET status='signed', signed_at=now(),
        signature_data_url=_signature_data_url,
        signature_ip=_ip, signature_user_agent=_ua
    WHERE id=_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.sign_contract_with_token(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sign_contract_with_token(text,text,text,text) TO anon, authenticated;
