import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    translation: {
      nav: {
        home: "INICIO",
        about: "NOSOTROS",
        projects: "PROYECTOS",
        blog: "BLOG",
        quote: "COTIZAR",
        contact: "CONTACTO",
        services: "SERVICIOS",
        vehicles: "VEHÍCULOS",
        machinery: "MAQUINARIA",
        construction: "CONSTRUCCIÓN",
        engineering: "INGENIERÍA",
        careers: "TRABAJA CON NOSOTROS",
        myAccount: "MI CUENTA",
        signIn: "ACCEDER",
      },
      footer: {
        services: "Servicios",
        company: "Empresa",
        contact: "Contacto",
        viewOnMaps: "Ver en Google Maps →",
        certifications: "Certificaciones",
        privacy: "Política de privacidad",
        careersLink: "Trabaja con nosotros",
        metrics: {
          projects: "Proyectos entregados",
          years: "Años de experiencia",
          employees: "Profesionales en obra",
          active: "Proyectos activos",
        },
      },
      common: {
        loading: "Cargando...",
        sendQuote: "Enviar cotización",
        readMore: "Leer más",
        language: "Idioma",
        save: "Guardar",
        cancel: "Cancelar",
        close: "Cerrar",
        search: "Buscar",
        viewAll: "Ver todos",
        contactUs: "Contáctanos",
        getQuote: "Solicitar cotización",
        learnMore: "Conoce más",
      },
      hero: {
        cta: "Solicita una cotización",
        scrollHint: "Desliza para descubrir",
      },
      contact: {
        title: "Contáctanos",
        subtitle: "Cuéntanos sobre tu proyecto",
        name: "Nombre",
        email: "Correo electrónico",
        phone: "Teléfono",
        message: "Mensaje",
        send: "Enviar mensaje",
        success: "Mensaje enviado correctamente",
        error: "No se pudo enviar el mensaje",
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: "HOME",
        about: "ABOUT US",
        projects: "PROJECTS",
        blog: "BLOG",
        quote: "QUOTE",
        contact: "CONTACT",
        services: "SERVICES",
        vehicles: "VEHICLES",
        machinery: "MACHINERY",
        construction: "CONSTRUCTION",
        engineering: "ENGINEERING",
        careers: "WORK WITH US",
        myAccount: "MY ACCOUNT",
        signIn: "SIGN IN",
      },
      footer: {
        services: "Services",
        company: "Company",
        contact: "Contact",
        viewOnMaps: "View on Google Maps →",
        certifications: "Certifications",
        privacy: "Privacy policy",
        careersLink: "Work with us",
        metrics: {
          projects: "Projects delivered",
          years: "Years of experience",
          employees: "Professionals on site",
          active: "Active projects",
        },
      },
      common: {
        loading: "Loading...",
        sendQuote: "Send quote",
        readMore: "Read more",
        language: "Language",
        save: "Save",
        cancel: "Cancel",
        close: "Close",
        search: "Search",
        viewAll: "View all",
        contactUs: "Contact us",
        getQuote: "Request a quote",
        learnMore: "Learn more",
      },
      hero: {
        cta: "Request a quote",
        scrollHint: "Scroll to discover",
      },
      contact: {
        title: "Contact us",
        subtitle: "Tell us about your project",
        name: "Name",
        email: "Email",
        phone: "Phone",
        message: "Message",
        send: "Send message",
        success: "Message sent successfully",
        error: "Could not send message",
      },
    },
  },
};

const NAV_LABEL_MAP: Record<string, string> = {
  "INICIO": "nav.home",
  "SOBRE NOSOTROS": "nav.about",
  "NOSOTROS": "nav.about",
  "PROYECTOS": "nav.projects",
  "BLOG": "nav.blog",
  "COTIZAR": "nav.quote",
  "CONTACTO": "nav.contact",
  "SERVICIOS": "nav.services",
  "VEHÍCULOS": "nav.vehicles",
  "MAQUINARIA": "nav.machinery",
  "CONSTRUCCIÓN": "nav.construction",
  "INGENIERÍA": "nav.engineering",
  "TRABAJA CON NOSOTROS": "nav.careers",
  "CARRERAS": "nav.careers",
};

export const translateNavLabel = (label: string): string => {
  const key = NAV_LABEL_MAP[label?.toUpperCase?.()];
  if (!key) return label;
  return i18n.t(key);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// Sync <html lang> with current language for accessibility and SEO
const syncHtmlLang = (lng: string) => {
  const code = (lng || "es").slice(0, 2);
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
};
syncHtmlLang(i18n.resolvedLanguage || i18n.language || "es");
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
