import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

async function sign(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { event, payload, webhook_id } = await req.json();
    if (!event) throw new Error('event required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let query = supabase.from('webhooks').select('*').eq('is_active', true).contains('events', [event]);
    if (webhook_id) query = supabase.from('webhooks').select('*').eq('id', webhook_id);

    const { data: hooks, error } = await query;
    if (error) throw error;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const results = [];
    for (const h of hooks ?? []) {
      const signature = await sign(h.secret, body);
      try {
        const res = await fetch(h.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Signature': signature, 'X-Event': event },
          body,
        });
        const respText = (await res.text()).slice(0, 2000);
        await supabase.from('webhook_deliveries').insert({
          webhook_id: h.id, event, payload, status_code: res.status, response: respText, ok: res.ok,
        });
        results.push({ id: h.id, ok: res.ok, status: res.status });
      } catch (e: any) {
        await supabase.from('webhook_deliveries').insert({
          webhook_id: h.id, event, payload, status_code: 0, response: String(e?.message ?? e), ok: false,
        });
        results.push({ id: h.id, ok: false, error: String(e?.message ?? e) });
      }
    }
    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
