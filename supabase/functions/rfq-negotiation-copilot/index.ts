// Ola AW - Copiloto IA de negociación para RFQs
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'missing_auth' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'unauthorized' }, 401);

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const { response_id } = await req.json();
    if (!response_id) return json({ error: 'missing_response_id' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load target response + RFQ + all competing responses
    const { data: resp } = await admin
      .from('rfq_responses')
      .select('*, suppliers(name,rating)')
      .eq('id', response_id).single();
    if (!resp) return json({ error: 'response_not_found' }, 404);

    const { data: rfq } = await admin.from('rfqs').select('*').eq('id', resp.rfq_id).single();
    const { data: items } = await admin.from('rfq_items').select('*').eq('rfq_id', resp.rfq_id).order('sort_order');
    const { data: allResp } = await admin
      .from('rfq_responses')
      .select('total_amount,delivery_days,payment_terms,validity_days,suppliers(name)')
      .eq('rfq_id', resp.rfq_id);

    const competitors = (allResp || []).filter((r: any) => r.suppliers?.name !== resp.suppliers?.name);
    const bestPrice = Math.min(...(allResp || []).map((r: any) => Number(r.total_amount || Infinity)));
    const bestDelivery = Math.min(...(allResp || []).map((r: any) => Number(r.delivery_days || Infinity)));

    const context = {
      rfq: { code: rfq?.code, title: rfq?.title, currency: rfq?.currency, deadline: rfq?.deadline, notes: rfq?.notes },
      items: (items || []).map((i: any) => ({ desc: i.description, qty: i.quantity, unit: i.unit })),
      supplier: {
        name: resp.suppliers?.name,
        rating: resp.suppliers?.rating,
        offer: {
          total: Number(resp.total_amount), currency: resp.currency,
          delivery_days: resp.delivery_days, payment_terms: resp.payment_terms,
          validity_days: resp.validity_days, notes: resp.notes,
        },
      },
      market: {
        offers_count: (allResp || []).length,
        best_price: bestPrice === Infinity ? null : bestPrice,
        best_delivery_days: bestDelivery === Infinity ? null : bestDelivery,
        competitors: competitors.map((c: any) => ({
          name: c.suppliers?.name, total: Number(c.total_amount),
          delivery_days: c.delivery_days, payment_terms: c.payment_terms,
        })),
      },
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'missing_ai_key' }, 500);

    const systemPrompt = `Eres un experto negociador B2B de compras industriales en Perú.
Analiza la oferta de un proveedor frente a la competencia en una RFQ y sugiere una contraoferta profesional, justa y realista.
Responde SIEMPRE en español, en formato markdown, breve (máx 250 palabras), con estas secciones:

## Análisis
Compara precio, entrega, condiciones de pago y validez vs la competencia. Menciona números.

## Contraoferta sugerida
- **Precio objetivo:** X (justifica el % de descuento razonable)
- **Entrega objetivo:** X días
- **Condiciones de pago:** X

## Mensaje al proveedor
Un párrafo redactado, tono cordial y firme, listo para copiar y enviar por email.

## Riesgos
2-3 bullets breves.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': LOVABLE_API_KEY },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Contexto de la RFQ y ofertas:\n\n```json\n' + JSON.stringify(context, null, 2) + '\n```' },
        ],
      }),
    });

    if (aiRes.status === 429) return json({ error: 'rate_limited', message: 'Demasiadas solicitudes, intenta en unos segundos.' }, 429);
    if (aiRes.status === 402) return json({ error: 'credits_exhausted', message: 'Créditos de IA agotados. Recarga en la configuración.' }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return json({ error: 'ai_error', detail: t }, 500);
    }

    const data = await aiRes.json();
    const suggestion = data?.choices?.[0]?.message?.content || 'Sin respuesta.';
    return json({ suggestion, context: { best_price: bestPrice, best_delivery: bestDelivery } });
  } catch (e: any) {
    return json({ error: 'internal', detail: e.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
