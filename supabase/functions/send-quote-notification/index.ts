import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteNotificationRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  itemName: string;
  itemType: string;
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
    return "edisone13.eer@gmail.com";
  }

  console.log("Using admin email from CMS:", data.email);
  return data.email;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Aleksey <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-quote-notification");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message, itemName, itemType }: QuoteNotificationRequest = await req.json();

    console.log(`Processing quote notification for: ${name} - ${email}`);
    console.log(`Item: ${itemType} - ${itemName}`);

    // Get admin email from CMS (contact_info table)
    const adminEmail = await getAdminEmail();

    // Send notification to admin
    const adminEmailResponse = await sendEmail(
      [adminEmail],
      `Nueva Solicitud de Cotización: ${itemType} - ${itemName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            Nueva Solicitud de Cotización
          </h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #f59e0b; margin-top: 0;">Detalles del ${itemType}</h2>
            <p><strong>Nombre:</strong> ${itemName}</p>
            <p><strong>Tipo:</strong> ${itemType}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Información del Cliente</h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
            <p><strong>Mensaje:</strong></p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 4px;">${message}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Este mensaje fue enviado desde el formulario de cotización de aleksey.pe
          </p>
        </div>
      `
    );

    console.log("Admin notification sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResponse,
        note: "Email sent to admin configured in CMS"
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quote-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
