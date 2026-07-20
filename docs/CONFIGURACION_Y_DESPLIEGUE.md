# ALEKSEY — Guía de Configuración y Despliegue

Sistema integral de gestión (CMS + ERP ligero) para ALEKSEY Construcción & Ingeniería.
Sitio público, portal de clientes, portal de operadores y panel administrativo.

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript |
| Estilos | Tailwind CSS v3 + tokens semánticos en `src/index.css` |
| UI | shadcn/ui + Radix + lucide-react |
| Ruteo | react-router-dom v6 |
| Estado servidor | @tanstack/react-query |
| Backend | Lovable Cloud (Supabase gestionado) |
| Auth | Supabase Auth (email/contraseña + Google OAuth) |
| Base de datos | Postgres con RLS + triggers + funciones SECURITY DEFINER |
| Edge Functions | Deno (Supabase Functions) |
| Realtime | Supabase Realtime (chat, notificaciones, alertas) |
| Storage | Supabase Storage (CVs, docs, firmas, fotos OT) |
| Mobile nativo | Capacitor (opcional, no requerido para web) |
| PWA | Service worker con soporte offline y cola de sincronización |
| Tests | Vitest + @testing-library/react + jsdom |

---

## 2. Estructura del Proyecto

```
src/
├── components/
│   ├── admin/          # Todos los paneles del CMS (68+ tabs)
│   ├── ui/             # Componentes shadcn
│   └── ...             # Nav, Footer, Layout, Chatbot, etc.
├── pages/              # Rutas públicas + Admin + Portales
├── hooks/              # useAuth, useAdminNotifications, useBranch, etc.
├── integrations/
│   └── supabase/       # Cliente autogenerado (NO EDITAR)
├── lib/                # utilidades: offlineQueue, native, pdf, i18nField
├── i18n/               # Config i18next (público)
└── test/               # setup + smoke tests
supabase/
├── functions/          # Edge Functions
└── migrations/         # Migraciones SQL versionadas
```

**Reglas críticas:**
- Nunca editar `src/integrations/supabase/client.ts` ni `types.ts` (autogenerados).
- Nunca editar `.env` manualmente (lo gestiona Lovable Cloud).
- Usar únicamente tokens semánticos (`bg-primary`, `text-foreground`) — nada de `bg-white`, `text-black` ni colores arbitrarios.

---

## 3. Configuración Inicial

### 3.1 Variables de entorno

Se generan automáticamente al conectar Lovable Cloud:

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL del backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key (pública, protegida por RLS) |
| `VITE_SUPABASE_PROJECT_ID` | Identificador del proyecto |

Las **claves privadas** (Resend, OpenAI, WhatsApp, etc.) se guardan como **Secrets de Edge Functions** desde el panel de Lovable (Settings → Secrets) y se consumen con `Deno.env.get("NOMBRE")` en las funciones.

### 3.2 Roles y accesos

Sistema de roles en tabla `user_roles` (nunca en `profiles`) con enum `app_role`:
- `admin` — acceso total al CMS
- `operator` — portal de operadores y OTs propias
- `client` — portal de cliente (`/mi-cuenta`, `/mis-solicitudes`)

Login admin: **`/admin/login`** (requiere rol `admin`).
Login cliente/operador: **`/portal/login`**.

### 3.3 Crear el primer administrador

1. Registrarse desde `/admin/login`.
2. Desde la consola de Lovable Cloud → SQL Editor:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<UUID_DEL_USUARIO>', 'admin');
   ```
3. Volver a iniciar sesión.

---

## 4. Rutas Principales

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Home con hero, servicios, testimonios |
| `/maquinaria`, `/vehiculos` | Catálogos con cotización |
| `/proyectos`, `/proyectos/:slug` | Portafolio |
| `/nosotros`, `/blog`, `/privacidad` | Contenido corporativo |
| `/convocatoria` | Vacantes y postulaciones |
| `/cotizar` | Formulario de cotización unificado |
| `/marketplace` | B2B — alquiler entre empresas |
| `/estado` | Status page pública |
| `/rfq/:token`, `/firmar/:token` | Portales anónimos por token |

### Autenticadas
| Ruta | Rol requerido |
|---|---|
| `/admin` | admin |
| `/mi-cuenta`, `/mis-solicitudes`, `/referidos` | cliente autenticado |
| `/mis-ot` | operator |

---

## 5. Módulos del CMS (68 tabs)

Organizados en 5 categorías desde `src/pages/Admin.tsx`. La pestaña activa se persiste en URL vía hash (`/admin#dashboard`).

- **General** (22): Dashboard, Analítica, Logo/Sitio, PDFs, Medios, Navegación, Usuarios, Sedes, Sucursales, API Keys, Auditoría, Salud, Backup, Errores, Webhooks, Integraciones, Asistente IA, Alertas, Reportes, Aprobaciones, Papelera, Portal de estado.
- **Contenido** (9): Hero, About, Estadísticas, Servicios, Proyectos, Testimonios, Maquinaria, Vehículos, Blog.
- **Comunicación** (12): Contacto, Mensajes, Solicitudes, Reservas, Plantillas, Docs. Clientes, Referidos, Fidelización, Pipeline CRM, Marketing, Inbox, Chat interno, Recordatorios.
- **Operaciones** (18): Calendario, Inventario, Órdenes de trabajo, Incidencias, Costos, BI, Data Warehouse, Predictivo, Documentos, Facturación, Contratos, Proveedores, Compras, RFQs, Contratos Marco, Pool, Despacho, Inspecciones, SLA.
- **RRHH** (4): Vacantes, Beneficios, Postulaciones, Empleados & Nómina.

---

## 6. Base de Datos

**~100 tablas** con RLS habilitado. Convenciones:
- Toda tabla `public.*` tiene `GRANT` explícito a `authenticated`/`service_role` en la misma migración.
- Timestamps `created_at`/`updated_at` con trigger `update_updated_at_column()`.
- Validaciones dependientes de tiempo (`> now()`) se hacen con **triggers**, no CHECK.
- Roles se validan con `public.has_role(auth.uid(), 'admin')` (SECURITY DEFINER).

Cambios de esquema: **solo** vía el flujo de migraciones de Lovable (nunca SQL manual en el dashboard).

---

## 7. Desarrollo Local

```bash
# Instalar dependencias
bun install

# Servidor de desarrollo (auto en Lovable)
bun dev            # → http://localhost:8080

# Tests
bunx vitest run --config vitest.config.ts

# Lint
bun run lint

# Build de producción
bun run build
```

El `predev`/`prebuild` regenera automáticamente `public/sitemap.xml` desde `scripts/generate-sitemap.ts`.

---

## 8. Despliegue

### 8.1 Publicar en Lovable

1. Click **Publish** (arriba-derecha del editor).
2. La URL viva es `https://aleksey.lovable.app`.
3. Los cambios **frontend** requieren pulsar "Update" para propagarse.
4. Los cambios **backend** (migraciones, edge functions) se despliegan automáticamente al aprobar.

### 8.2 Dominio personalizado

Project Settings → Domains → Connect Domain. Configurar en el registrador:
- `A @ → 185.158.133.1`
- `A www → 185.158.133.1`
- `TXT _lovable → lovable_verify=<código>`

SSL se emite automáticamente. Propagación DNS hasta 72h.

### 8.3 Checklist pre-producción

- [ ] Ejecutar `Security Scan` desde Lovable Cloud y resolver findings críticos.
- [ ] Verificar `supabase--linter` sin warnings de RLS.
- [ ] Confirmar que todas las tablas nuevas tienen GRANT + RLS + políticas.
- [ ] Configurar dominio de correo (Resend) antes de activar notificaciones por email.
- [ ] Configurar OAuth de Google (Redirect URLs = `https://<dominio>` y `https://<dominio>/auth/callback`).
- [ ] Revisar `pdf_settings` (logo, colores de marca).
- [ ] Sembrar `hero_content`, `about_content`, `contact_info`, `navigation_links`.
- [ ] Crear al menos un `branches` + `organizations` por defecto.

---

## 9. Edge Functions

Ubicación: `supabase/functions/<nombre>/index.ts`. Se despliegan automáticamente con la migración/aprobación. Notables:

| Función | Propósito |
|---|---|
| `admin-assistant` | Chat IA (Gemini 2.5 Flash) para el panel admin |
| `financial-alerts` | Cron: alertas de facturas vencidas, stock bajo |
| `send-notifications` | Envío de emails/WhatsApp según plantillas |
| `public-api` | API pública con rate-limit por `api_keys` |
| `webhook-dispatch` | Entrega asíncrona de eventos a URLs externas |

---

## 10. PWA & Offline

- Service worker con `NetworkFirst` para HTML, `CacheFirst` para assets hasheados.
- Cola offline (`src/lib/offlineQueue.ts`) con backoff exponencial para OTs, firmas y fotos.
- **No se registra** en el preview de Lovable ni en dev; solo en producción publicada.
- Panel admin "Pendientes offline" para ver la cola pendiente.

---

## 11. Testing

```bash
bunx vitest run --config vitest.config.ts
```

Smoke test cubre montaje básico + providers. Añadir tests co-ubicados como `Componente.test.tsx`.

Smoke E2E manual disponible en `/tmp/browser/smoke/*.py` (Playwright).

---

## 12. Seguridad

- RLS obligatorio en toda tabla de `public`.
- Roles solo en `user_roles`, jamás en `profiles`.
- Función `has_role()` es SECURITY DEFINER con `SET search_path = public`.
- Sin sign-up anónimo. Sin auto-confirm de email salvo requerimiento explícito.
- HIBP (contraseñas comprometidas) activo en Supabase Auth.
- Storage con políticas por bucket (CVs y firmas son privados).
- Auditoría completa en `audit_log` con streaming en `/admin#audit`.

---

## 13. Soporte

- Ver **Lovable Cloud** desde el botón "View Backend" en la barra lateral.
- Logs de Edge Functions: pestaña "Errores" del CMS o consola de Lovable Cloud.
- Estado del sistema público: `/estado`.
