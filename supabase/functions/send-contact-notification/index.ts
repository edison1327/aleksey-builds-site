import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

async function sendEmail(to: string[], subject: string, html: string) {
  console.log(`Sending email to: ${to.join(", ")}`);
  
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

    // IMPORTANT: In Resend test mode, we can only send to the verified email
    // Change this to your verified email address, or verify a domain at resend.com/domains
    const ADMIN_EMAIL = "edisone13.eer@gmail.com";

    // Send notification to admin
    const adminEmailResponse = await sendEmail(
      [ADMIN_EMAIL],
      `Nuevo Mensaje de Contacto: ${name}`,
      `
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
      `
    );

    console.log("Admin notification sent:", adminEmailResponse);

    // Note: Customer confirmation email is disabled in test mode
    // To enable it, verify a domain at resend.com/domains and update the 'from' address

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResponse,
        note: "Customer email disabled in test mode - verify domain at resend.com/domains to enable"
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
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
