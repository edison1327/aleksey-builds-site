import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const render = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Load active templates
  const { data: templates } = await supabase
    .from('reminder_templates')
    .select('*')
    .eq('is_active', true);

  const overdueTpl = templates?.find((t: any) => t.key === 'pipeline_overdue');
  const upcomingTpl = templates?.find((t: any) => t.key === 'pipeline_upcoming');

  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from('contact_messages')
    .select('id, name, crm_next_action, crm_next_action_at, assigned_to, crm_stage')
    .not('crm_next_action_at', 'is', null)
    .not('crm_stage', 'in', '(won,lost)');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let created = 0;
  let processed = 0;

  const dispatch = async (row: any, tpl: any, kind: string) => {
    if (!tpl) return;
    // Dedup within last 20h per (message, template kind)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'reminder')
      .contains('metadata', { message_id: row.id, kind })
      .gte('created_at', new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
      .limit(1);
    if (existing && existing.length > 0) return;

    const vars = {
      name: row.name ?? 'Lead',
      action: row.crm_next_action ?? 'seguimiento',
      stage: row.crm_stage ?? '',
    };
    const payload = {
      type: 'reminder',
      title: render(tpl.title, vars),
      message: render(tpl.message, vars),
      link: '/admin#pipeline',
      metadata: { message_id: row.id, kind, template_key: tpl.key },
    };

    if (row.assigned_to) {
      await supabase.from('notifications').insert({ ...payload, user_id: row.assigned_to });
    } else {
      await supabase.rpc('notify_admins', {
        _type: payload.type,
        _title: payload.title,
        _message: payload.message,
        _link: payload.link,
        _metadata: payload.metadata,
      });
    }
    created++;
  };

  for (const row of rows ?? []) {
    processed++;
    const due = new Date(row.crm_next_action_at).getTime();
    const now = Date.now();

    // overdue: due <= now + offset_hours*3600s
    if (overdueTpl) {
      const cutoff = now + (overdueTpl.offset_hours ?? 0) * 3600 * 1000;
      if (due <= cutoff) await dispatch(row, overdueTpl, 'overdue');
    }
    // upcoming: due in the future but within |offset| window
    if (upcomingTpl) {
      const windowMs = Math.abs(upcomingTpl.offset_hours ?? 24) * 3600 * 1000;
      if (due > now && due - now <= windowMs) await dispatch(row, upcomingTpl, 'upcoming');
    }
  }

  return new Response(JSON.stringify({ processed, created, templates: templates?.length ?? 0 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
