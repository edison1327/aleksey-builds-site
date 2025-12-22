import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// In production, set this to a verified-domain sender, e.g. "Aleksey <no-reply@tudominio.com>"
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Aleksey <onboarding@resend.dev>";
// Resend test-mode fallback (Resend only allows sending to the verified account email)
const RESEND_TEST_EMAIL = Deno.env.get("RESEND_TEST_EMAIL") ?? "edisone13.eer@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

async function getAdminEmail(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("contact_info")
    .select("email")
    .limit(1)
    .single();

  if (error || !data?.email) {
    console.log("No admin email found in contact_info, using fallback");
    return RESEND_TEST_EMAIL;
  }

  console.log("Using admin email from CMS:", data.email);
  return data.email;
}

async function sendEmail(args: { to: string[]; subject: string; html: string; replyTo?: string }) {
  console.log(`Sending email to: ${args.to.join(", ")}`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API error:", error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-contact-notification");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactNotificationRequest = await req.json();

    console.log(`Processing contact notification from: ${name} - ${email}`);

    // Get admin email from CMS (contact_info table)
    const adminEmail = await getAdminEmail();

    const subject = `Nuevo Mensaje de Contacto: ${name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
          Nuevo Mensaje de Contacto
        </h1>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Información del Contacto</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f59e0b; margin-top: 0;">Mensaje</h2>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Este mensaje fue enviado desde el formulario de contacto de aleksey.pe
        </p>
      </div>
    `;

    try {
      const adminEmailResponse = await sendEmail({
        to: [adminEmail],
        subject,
        html,
        replyTo: email,
      });

      console.log("Admin notification sent:", adminEmailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          adminEmail: adminEmailResponse,
          adminRecipient: adminEmail,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);

      if (msg.includes("You can only send testing emails")) {
        console.warn("Resend test-mode restriction detected; sending to RESEND_TEST_EMAIL instead.");

        const fallbackResponse = await sendEmail({
          to: [RESEND_TEST_EMAIL],
          subject: `[TEST MODE] ${subject}`,
          html: `${html}<p style="color:#b45309;margin-top:16px;"><strong>Nota:</strong> Se intentó enviar a <code>${adminEmail}</code>, pero Resend está en modo prueba.</p>`,
          replyTo: email,
        });

        return new Response(
          JSON.stringify({
            success: true,
            adminEmail: fallbackResponse,
            adminRecipient: RESEND_TEST_EMAIL,
            intendedAdminRecipient: adminEmail,
            warning:
              "Resend está en modo prueba: solo permite enviar al email verificado. Verifica tu dominio y configura RESEND_FROM para producción.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      throw err;
    }
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
