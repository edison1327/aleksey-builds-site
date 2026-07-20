import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RoleEnum = z.enum([
  'admin', 'manager', 'editor', 'viewer', 'operator', 'supplier', 'client', 'user',
]);

const BranchIds = z.array(z.string().uuid()).optional();

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({
    action: z.literal('create'),
    email: z.string().trim().email('Email inválido').max(255),
    password: z.string().min(8).max(72),
    role: RoleEnum.optional(),
    branch_ids: BranchIds,
  }),
  z.object({
    action: z.literal('update'),
    userId: z.string().uuid(),
    email: z.string().trim().email().max(255).optional(),
    password: z.string().min(8).max(72).optional(),
    role: RoleEnum.optional(),
    branch_ids: BranchIds,
  }),
  z.object({ action: z.literal('delete'), userId: z.string().uuid() }),
]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function syncUserBranches(admin: any, userId: string, branchIds: string[]) {
  await admin.from('user_branches').delete().eq('user_id', userId);
  if (branchIds.length) {
    await admin.from('user_branches').insert(
      branchIds.map((branch_id) => ({ user_id: userId, branch_id }))
    );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401);

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'No autorizado' }, 401);

    // Requester must be admin OR manager
    const { data: rolesData } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id);
    const requesterRoles: string[] = (rolesData ?? []).map((r: any) => r.role);
    const isAdmin = requesterRoles.includes('admin');
    const isManager = requesterRoles.includes('manager');
    if (!isAdmin && !isManager) {
      return jsonResponse({ error: 'Acceso denegado. Se requiere admin o manager.' }, 403);
    }

    let rawPayload: unknown;
    try { rawPayload = await req.json(); }
    catch { return jsonResponse({ error: 'Cuerpo de la solicitud inválido' }, 400); }

    const validated = ActionSchema.safeParse(rawPayload);
    if (!validated.success) {
      return jsonResponse(
        { error: 'Datos inválidos', details: validated.error.flatten().fieldErrors }, 400,
      );
    }
    const payload = validated.data;

    // Manager restriction: cannot touch admins
    const guardManager = async (targetUserId?: string, requestedRole?: string) => {
      if (isAdmin) return null;
      if (requestedRole === 'admin') {
        return jsonResponse({ error: 'Solo un administrador puede asignar el rol admin.' }, 403);
      }
      if (targetUserId) {
        const { data: tRoles } = await supabaseAdmin
          .from('user_roles').select('role').eq('user_id', targetUserId);
        if ((tRoles ?? []).some((r: any) => r.role === 'admin')) {
          return jsonResponse({ error: 'No puedes modificar a un administrador.' }, 403);
        }
      }
      return null;
    };

    switch (payload.action) {
      case 'list': {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        const { data: roles } = await supabaseAdmin.from('user_roles').select('*');
        const { data: userBranches } = await supabaseAdmin.from('user_branches').select('*');
        const usersWithRoles = users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          role: (roles ?? []).find((r: any) => r.user_id === u.id)?.role || 'user',
          branch_ids: (userBranches ?? []).filter((b: any) => b.user_id === u.id).map((b: any) => b.branch_id),
        }));
        return jsonResponse({ users: usersWithRoles });
      }

      case 'create': {
        const { email, password, role, branch_ids } = payload;
        const guard = await guardManager(undefined, role);
        if (guard) return guard;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true,
        });
        if (createError) return jsonResponse({ error: createError.message }, 400);

        await supabaseAdmin.from('user_roles').insert({
          user_id: newUser.user.id, role: role || 'user',
        });

        if (branch_ids && branch_ids.length) {
          await syncUserBranches(supabaseAdmin, newUser.user.id, branch_ids);
        }

        return jsonResponse({ user: newUser.user, message: 'Usuario creado correctamente' });
      }

      case 'update': {
        const { userId, email, password, role, branch_ids } = payload;
        const guard = await guardManager(userId, role);
        if (guard) return guard;

        const updateData: { email?: string; password?: string } = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId, updateData,
          );
          if (updateError) return jsonResponse({ error: updateError.message }, 400);
        }

        if (role) {
          const { data: existingRole } = await supabaseAdmin
            .from('user_roles').select('id').eq('user_id', userId).maybeSingle();
          if (existingRole) {
            await supabaseAdmin.from('user_roles').update({ role }).eq('user_id', userId);
          } else {
            await supabaseAdmin.from('user_roles').insert({ user_id: userId, role });
          }
        }

        if (Array.isArray(branch_ids)) {
          await syncUserBranches(supabaseAdmin, userId, branch_ids);
        }

        return jsonResponse({ message: 'Usuario actualizado correctamente' });
      }

      case 'delete': {
        const { userId } = payload;
        if (userId === user.id) {
          return jsonResponse({ error: 'No puedes eliminar tu propia cuenta' }, 400);
        }
        const guard = await guardManager(userId);
        if (guard) return guard;

        await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
        await supabaseAdmin.from('user_branches').delete().eq('user_id', userId);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) return jsonResponse({ error: deleteError.message }, 400);

        return jsonResponse({ message: 'Usuario eliminado correctamente' });
      }

      default:
        return jsonResponse({ error: 'Acción no válida' }, 400);
    }
  } catch (error) {
    console.error('Error in manage-users function:', error);
    return jsonResponse({ error: 'Error interno del servidor.' }, 500);
  }
});
