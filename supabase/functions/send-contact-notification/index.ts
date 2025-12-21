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

    // Send notification to admin
    const adminEmailResponse = await sendEmail(
      ["admin@aleksey.pe"],
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

    // Send confirmation to customer
    const customerEmailResponse = await sendEmail(
      [email],
      "Hemos recibido tu mensaje - Aleksey",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            ¡Gracias por contactarnos, ${name}!
          </h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hemos recibido tu mensaje y nuestro equipo lo revisará a la brevedad posible.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #f59e0b; margin-top: 0;">Tu mensaje:</h3>
            <p style="white-space: pre-wrap; color: #666; font-style: italic;">${message}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Te contactaremos pronto a través de tu email o número de teléfono proporcionado.
          </p>
          
          <p style="margin-top: 30px;">
            <strong>Saludos cordiales,</strong><br>
            El equipo de Aleksey
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px;">
            Si tienes alguna pregunta adicional, no dudes en contactarnos.
          </p>
        </div>
      `
    );

    console.log("Customer confirmation sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResponse, 
        customerEmail: customerEmailResponse 
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
