import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
