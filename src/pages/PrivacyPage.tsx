import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const PrivacyPage = () => {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Política de Privacidad — ALEKSEY"
        description="Información sobre el tratamiento de datos personales, cookies y derechos de los usuarios del sitio web de ALEKSEY."
        path="/privacidad"
      />

      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary-foreground">
            Política de privacidad y cookies
          </h1>
          <p className="mt-4 text-secondary-foreground/80">
            Última actualización: 21 de junio de 2026
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl prose prose-neutral dark:prose-invert">
          <p>
            Esta política describe cómo ALEKSEY Ingeniería y Construcción (en adelante,
            "ALEKSEY") trata los datos personales que recopila a través de este sitio web,
            así como el uso de cookies. Esta página es mantenida por ALEKSEY para responder
            preguntas frecuentes de los visitantes; no constituye una certificación
            independiente.
          </p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            ALEKSEY Ingeniería y Construcción, con sede en Lima, Perú. Para consultas sobre
            privacidad puedes escribirnos a <a href="mailto:contacto@aleksey.pe">contacto@aleksey.pe</a>.
          </p>

          <h2>2. Datos que recopilamos</h2>
          <ul>
            <li>Datos que tú nos proporcionas al rellenar formularios de contacto, cotización o postulación (nombre, email, teléfono, mensaje, CV).</li>
            <li>Datos técnicos básicos del navegador necesarios para el funcionamiento del sitio.</li>
            <li>Datos de uso agregados, solo si aceptas las cookies de análisis.</li>
          </ul>

          <h2>3. Finalidad</h2>
          <ul>
            <li>Atender tu solicitud de contacto o cotización.</li>
            <li>Gestionar postulaciones a vacantes.</li>
            <li>Mejorar la experiencia del sitio (solo con consentimiento).</li>
          </ul>

          <h2>4. Base legal</h2>
          <p>
            El tratamiento se basa en tu consentimiento al enviar un formulario o aceptar
            las cookies, y en nuestro interés legítimo de mantener el sitio seguro y
            operativo.
          </p>

          <h2>5. Cookies</h2>
          <p>Usamos dos categorías de cookies:</p>
          <ul>
            <li>
              <strong>Esenciales:</strong> necesarias para que el sitio funcione (sesión,
              preferencias de idioma y tema, seguridad). No requieren consentimiento.
            </li>
            <li>
              <strong>De análisis (opcional):</strong> nos ayudan a entender qué contenidos
              son útiles. Solo se cargan si haces clic en "Aceptar" en el aviso de cookies.
            </li>
          </ul>
          <p>
            Puedes cambiar tu elección en cualquier momento borrando los datos del sitio
            desde tu navegador.
          </p>

          <h2>6. Conservación</h2>
          <p>
            Conservamos los datos el tiempo necesario para atender la solicitud y cumplir
            obligaciones legales. Los CV de postulantes se conservan hasta 12 meses salvo
            que solicites su eliminación antes.
          </p>

          <h2>7. Tus derechos</h2>
          <p>
            Puedes solicitar acceso, rectificación, supresión, oposición o portabilidad de
            tus datos escribiendo a <a href="mailto:contacto@aleksey.pe">contacto@aleksey.pe</a>.
          </p>

          <h2>8. Subencargados</h2>
          <p>
            El sitio se aloja en infraestructura de Lovable y utiliza Supabase como base de
            datos y autenticación, y Resend para el envío de correos transaccionales cuando
            corresponda.
          </p>

          <h2>9. Cambios</h2>
          <p>
            Podemos actualizar esta política; publicaremos cualquier cambio en esta misma
            página indicando la fecha de la última actualización.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
