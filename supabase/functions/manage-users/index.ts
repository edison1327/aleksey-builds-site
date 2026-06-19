import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RoleEnum = z.enum(['admin', 'user']);

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({
    action: z.literal('create'),
    email: z.string().trim().email('Email inválido').max(255),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
    role: RoleEnum.optional(),
  }),
  z.object({
    action: z.literal('update'),
    userId: z.string().uuid('ID de usuario inválido'),
    email: z.string().trim().email().max(255).optional(),
    password: z.string().min(8).max(72).optional(),
    role: RoleEnum.optional(),
  }),
  z.object({
    action: z.literal('delete'),
    userId: z.string().uuid('ID de usuario inválido'),
  }),
]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client to verify the requesting user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.log('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Se requiere rol de administrador.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo de la solicitud inválido' }, 400);
    }

    const validated = ActionSchema.safeParse(rawPayload);
    if (!validated.success) {
      console.log('Validation failed:', validated.error.flatten());
      return jsonResponse(
        { error: 'Datos inválidos', details: validated.error.flatten().fieldErrors },
        400
      );
    }
    const action = validated.data.action;
    console.log('Action:', action);

    switch (action) {
      case 'list': {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          throw listError;
        }

        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('*');

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }

        const usersWithRoles = users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          role: roles.find((r) => r.user_id === u.id)?.role || 'user',
        }));

        console.log('Listed users:', usersWithRoles.length);
        return jsonResponse({ users: usersWithRoles });
      }

      case 'create': {
        const { email, password, role } = validated.data;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          console.error('Error creating user:', createError);
          return jsonResponse({ error: createError.message }, 400);
        }

        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: role || 'user',
          });

        if (roleInsertError) {
          console.error('Error assigning role:', roleInsertError);
        }

        console.log('Created user:', newUser.user.id);
        return jsonResponse({ user: newUser.user, message: 'Usuario creado correctamente' });
      }

      case 'update': {
        const { userId, email, password, role } = params;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'ID de usuario requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update user email/password if provided
        const updateData: { email?: string; password?: string } = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateData
          );

          if (updateError) {
            console.error('Error updating user:', updateError);
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Update role if provided
        if (role) {
          // Check if user has a role already
          const { data: existingRole } = await supabaseAdmin
            .from('user_roles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (existingRole) {
            const { error: roleUpdateError } = await supabaseAdmin
              .from('user_roles')
              .update({ role })
              .eq('user_id', userId);

            if (roleUpdateError) {
              console.error('Error updating role:', roleUpdateError);
            }
          } else {
            const { error: roleInsertError } = await supabaseAdmin
              .from('user_roles')
              .insert({ user_id: userId, role });

            if (roleInsertError) {
              console.error('Error inserting role:', roleInsertError);
            }
          }
        }

        console.log('Updated user:', userId);
        return new Response(
          JSON.stringify({ message: 'Usuario actualizado correctamente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { userId } = params;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'ID de usuario requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prevent self-deletion
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'No puedes eliminar tu propia cuenta' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete user role first
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Delete user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Deleted user:', userId);
        return new Response(
          JSON.stringify({ message: 'Usuario eliminado correctamente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in manage-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
