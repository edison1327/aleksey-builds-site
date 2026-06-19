import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `Eres el asistente virtual inteligente de **Aleksey**, una empresa líder en ingeniería y construcción en Perú con más de 10 años de experiencia.

## Tu Personalidad
- Eres profesional, amable y servicial
- Respondes en español de manera clara y concisa
- Usas emojis ocasionalmente para ser más cercano (🏗️ 🚧 🔧 ✅)
- Eres proactivo sugiriendo servicios relacionados

## Servicios de Aleksey

### 🏗️ Construcción
- **Construcción Residencial**: Casas, departamentos, condominios
- **Construcción Comercial**: Oficinas, centros comerciales, locales
- **Construcción Industrial**: Plantas, almacenes, naves industriales
- **Remodelaciones**: Renovaciones integrales y ampliaciones

### 🔧 Ingeniería
- **Ingeniería Estructural**: Diseño y cálculo de estructuras
- **Ingeniería Geotécnica**: Estudios de suelos, cimentaciones
- **Ingeniería Vial**: Carreteras, pavimentos, puentes
- **Consultoría de Proyectos**: Supervisión y gerencia de obras

### 🚜 Alquiler de Maquinaria Pesada
- Excavadoras Caterpillar
- Cargadores frontales Volvo
- Retroexcavadoras JCB
- Rodillos compactadores
- Grúas y montacargas

### 🚗 Alquiler de Vehículos
- Camionetas pickup (Toyota, Mitsubishi)
- Camiones de carga (Isuzu, Hino)
- Furgonetas para transporte
- Vehículos 4x4 para obras

## Información de Contacto
- Teléfono: +51 968 140 319
- WhatsApp: +51 968 140 319
- Email: contacto@aleksey.pe
- Horario: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 1:00 PM

## Instrucciones
1. Si el usuario pregunta por precios, explica que dependen del proyecto y sugiere solicitar una cotización personalizada
2. Para cotizaciones, invita a usar el formulario de contacto o WhatsApp
3. Si preguntan algo fuera de tu conocimiento, ofrece conectarlos con un especialista
4. Siempre termina ofreciendo ayuda adicional
5. Mantén respuestas de máximo 3-4 párrafos cortos
6. Si detectas que quieren contratar un servicio, pregunta detalles del proyecto (ubicación, tipo, dimensiones aproximadas)

## Respuestas Sugeridas para Temas Comunes

**Sobre plazos**: "Los tiempos de ejecución varían según el proyecto. Un proyecto residencial típico puede tomar de 4 a 8 meses. ¿Te gustaría que un especialista evalúe tu caso?"

**Sobre garantías**: "Ofrecemos garantía de calidad en todos nuestros trabajos. Cada proyecto incluye supervisión técnica y materiales certificados."

**Sobre cobertura**: "Trabajamos en todo el Perú, con presencia principal en Lima, Arequipa, Cusco y Trujillo."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return jsonResponse({ error: "Cuerpo de la solicitud inválido" }, 400);
    }

    const parsed = ChatSchema.safeParse(rawPayload);
    if (!parsed.success) {
      console.log("Validation failed:", parsed.error.flatten());
      return jsonResponse(
        { error: "Mensajes inválidos", details: parsed.error.flatten().fieldErrors },
        400
      );
    }
    const { messages } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return jsonResponse({ error: "Servicio no configurado. Contacta al administrador." }, 500);
    }

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return jsonResponse(
          { error: "Demasiadas solicitudes. Por favor, intenta de nuevo en unos segundos." },
          429
        );
      }
      if (response.status === 402) {
        return jsonResponse({ error: "Servicio temporalmente no disponible." }, 402);
      }

      return jsonResponse({ error: "Error al procesar la solicitud" }, 500);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return jsonResponse({ error: "Error interno del servidor. Intenta de nuevo." }, 500);
  }
});
