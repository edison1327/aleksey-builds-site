import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Overdue: crm_next_action_at <= now, not closed
  const { data: overdue, error } = await supabase
    .from('contact_messages')
    .select('id, name, crm_next_action, crm_next_action_at, assigned_to, crm_stage')
    .lte('crm_next_action_at', new Date().toISOString())
    .not('crm_stage', 'in', '(won,lost)');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let created = 0;
  for (const row of overdue ?? []) {
    // Avoid duplicate reminder same day
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'reminder')
      .contains('metadata', { message_id: row.id })
      .gte('created_at', new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
      .limit(1);
    if (existing && existing.length > 0) continue;

    if (row.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: row.assigned_to,
        type: 'reminder',
        title: 'Acción pendiente vencida',
        message: `${row.name ?? 'Lead'}: ${row.crm_next_action ?? 'seguimiento'}`,
        link: '/admin#pipeline',
        metadata: { message_id: row.id },
      });
      created++;
    } else {
      await supabase.rpc('notify_admins', {
        _type: 'reminder',
        _title: 'Acción pendiente vencida',
        _message: `${row.name ?? 'Lead'}: ${row.crm_next_action ?? 'seguimiento'}`,
        _link: '/admin#pipeline',
        _metadata: { message_id: row.id },
      });
      created++;
    }
  }

  return new Response(JSON.stringify({ processed: overdue?.length ?? 0, created }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
