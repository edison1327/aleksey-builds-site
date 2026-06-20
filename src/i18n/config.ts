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
        careers: "CARRERAS",
        myAccount: "MI CUENTA",
        signIn: "ACCEDER",
      },
      footer: {
        services: "Servicios",
        company: "Empresa",
        contact: "Contacto",
      },
      common: {
        loading: "Cargando...",
        sendQuote: "Enviar cotización",
        readMore: "Leer más",
        language: "Idioma",
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
      },
      common: {
        loading: "Loading...",
        sendQuote: "Send quote",
        readMore: "Read more",
        language: "Language",
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

export default i18n;
