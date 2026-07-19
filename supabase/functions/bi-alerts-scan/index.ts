import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n || 0);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const [projects, cash, monthly, budgets] = await Promise.all([
      supabase.rpc('get_project_pnl'),
      supabase.rpc('get_cash_forecast'),
      supabase.rpc('get_monthly_pnl'),
      supabase.from('project_budgets').select('*'),
    ]);

    type Alert = { type: string; title: string; msg: string; link: string; meta: Record<string, unknown> };
    const alerts: Alert[] = [];

    // 1. Proyectos en pérdida / margen bajo
    for (const p of (projects.data || []) as Array<Record<string, unknown>>) {
      const pct = Number(p.margin_pct);
      const cost = Number(p.total_cost);
      const inv = Number(p.invoiced_total);
      if (cost === 0 && inv === 0) continue;
      if (pct < 0) {
        alerts.push({
          type: 'bi_project_loss',
          title: `Proyecto en pérdida: ${p.project_title}`,
          msg: `Margen ${pct.toFixed(1)}% — costo ${fmt(cost)} vs facturado ${fmt(inv)}`,
          link: '/admin#bi',
          meta: { project_id: p.project_id, margin_pct: pct },
        });
      }
    }

    // 2. Sobrecosto por categoría
    const byProj = new Map<string, Map<string, number>>();
    for (const b of (budgets.data || []) as Array<Record<string, unknown>>) {
      const pid = String(b.project_id);
      if (!byProj.has(pid)) byProj.set(pid, new Map());
      const m = byProj.get(pid)!;
      m.set(String(b.category), (m.get(String(b.category)) || 0) + Number(b.planned_amount));
    }
    for (const p of (projects.data || []) as Array<Record<string, unknown>>) {
      const plans = byProj.get(String(p.project_id));
      if (!plans) continue;
      const checks: [string, number, string][] = [
        ['labor', Number(p.labor_cost), 'Mano de obra'],
        ['materials', Number(p.materials_cost), 'Materiales'],
        ['subcontract', Number(p.subcontract_cost), 'Subcontratos'],
      ];
      for (const [cat, real, label] of checks) {
        const plan = plans.get(cat) || 0;
        if (plan > 0 && real > plan * 1.2) {
          const over = ((real - plan) / plan) * 100;
          alerts.push({
            type: 'bi_budget_overrun',
            title: `Sobrecosto ${label}: ${p.project_title}`,
            msg: `Real ${fmt(real)} supera plan ${fmt(plan)} (+${over.toFixed(0)}%)`,
            link: '/admin#bi',
            meta: { project_id: p.project_id, category: cat },
          });
        }
      }
    }

    // 3. Liquidez negativa próximas 4 semanas
    const next4 = ((cash.data || []) as Array<Record<string, unknown>>).slice(0, 4);
    const net4 = next4.reduce((s, r) => s + Number(r.net || 0), 0);
    if (next4.length && net4 < 0) {
      alerts.push({
        type: 'bi_cash_negative',
        title: 'Alerta de liquidez',
        msg: `Flujo neto proyectado próximas 4 semanas: ${fmt(net4)}`,
        link: '/admin#bi',
        meta: { net_4w: net4 },
      });
    }

    // 4. Mes actual costos > ingresos
    const now = new Date();
    const current = ((monthly.data || []) as Array<Record<string, unknown>>).find((m) => {
      const d = new Date(String(m.month));
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    if (current) {
      const cost = Number(current.purchase_cost) + Number(current.labor_cost);
      const inv = Number(current.invoiced);
      if (cost > inv && cost > 0) {
        alerts.push({
          type: 'bi_month_negative',
          title: 'Costos superan ingresos este mes',
          msg: `Ingresos ${fmt(inv)} vs costos ${fmt(cost)}`,
          link: '/admin#bi',
          meta: { month: current.month },
        });
      }
    }

    // Deduplicar contra notificaciones ya emitidas hoy
    const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('type, metadata')
      .in('type', ['bi_project_loss', 'bi_budget_overrun', 'bi_cash_negative', 'bi_month_negative'])
      .gte('created_at', since);

    const seen = new Set(
      (existing || []).map((e) => `${e.type}::${JSON.stringify(e.metadata || {})}`),
    );

    let sent = 0;
    for (const a of alerts) {
      const key = `${a.type}::${JSON.stringify(a.meta)}`;
      if (seen.has(key)) continue;
      const { error } = await supabase.rpc('notify_admins', {
        _type: a.type,
        _title: a.title,
        _message: a.msg,
        _link: a.link,
        _metadata: a.meta,
      });
      if (!error) sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, detected: alerts.length, sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('bi-alerts-scan failed', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
