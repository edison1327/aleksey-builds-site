import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(4000),
});
const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function gatherContext(client: ReturnType<typeof createClient>) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const safe = async <T,>(p: PromiseLike<T>): Promise<T | null> => {
    try { return await p; } catch { return null; }
  };

  const [
    msgs, quotes, invoicesMonth, workOrdersOpen, machinery, vehicles,
    lowStock, pendingApps, rfqsOpen, suppliersTop,
  ] = await Promise.all([
    safe(client.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new")),
    safe(client.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_quote_request", true).eq("status", "new")),
    safe(client.from("invoices").select("total, status").gte("issue_date", monthStart)),
    safe(client.from("work_orders").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"])),
    safe(client.from("machinery").select("id", { count: "exact", head: true })),
    safe(client.from("vehicles").select("id", { count: "exact", head: true })),
    safe(client.from("stock_items").select("name, quantity, min_quantity").lt("quantity", 10).limit(10)),
    safe(client.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
    safe(client.from("rfqs").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"])),
    safe(client.from("suppliers").select("name, rating").order("rating", { ascending: false }).limit(5)),
  ]);

  const invMonth = (invoicesMonth as any)?.data ?? [];
  const revMonth = invMonth.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
  const pendMonth = invMonth.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);

  return {
    fecha: now.toISOString().slice(0, 10),
    mensajes_nuevos: (msgs as any)?.count ?? 0,
    cotizaciones_pendientes: (quotes as any)?.count ?? 0,
    ingresos_mes_pagados: revMonth,
    facturado_mes_pendiente: pendMonth,
    facturas_mes_total: invMonth.length,
    ots_abiertas: (workOrdersOpen as any)?.count ?? 0,
    total_maquinaria: (machinery as any)?.count ?? 0,
    total_vehiculos: (vehicles as any)?.count ?? 0,
    stock_bajo: ((lowStock as any)?.data ?? []).map((s: any) => `${s.name} (${s.quantity})`),
    postulaciones_pendientes: (pendingApps as any)?.count ?? 0,
    rfqs_abiertos: (rfqsOpen as any)?.count ?? 0,
    top_proveedores: ((suppliersTop as any)?.data ?? []).map((s: any) => `${s.name}(${s.rating ?? 0})`),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Servicio no configurado" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No autorizado" }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "No autorizado" }, 401);

    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Solo administradores" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Solicitud inválida" }, 400);

    const context = await gatherContext(admin);

    const system = `Eres el asistente IA interno del equipo Aleksey (constructora/ingeniería). Respondes en español, breve, con datos concretos.

DATOS OPERATIVOS EN TIEMPO REAL (${context.fecha}):
${JSON.stringify(context, null, 2)}

Reglas:
- Usa los datos anteriores para responder. Si te preguntan algo fuera de ellos, dilo con transparencia.
- Sugiere acciones concretas (ej: "revisa la bandeja de mensajes", "reordena stock de X").
- Formatea montos como S/ 0,000.
- Máximo 4 párrafos cortos, usa listas cuando ayude.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...parsed.data.messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) return json({ error: "Límite de solicitudes alcanzado" }, 429);
      if (response.status === 402) return json({ error: "Créditos IA agotados" }, 402);
      return json({ error: "Error del proveedor IA" }, 500);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-assistant error:", e);
    return json({ error: "Error interno" }, 500);
  }
});
