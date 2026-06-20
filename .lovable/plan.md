## Objetivo
Internacionalizar el contenido dinámico de la base de datos (ES/EN) usando columnas JSONB `*_i18n` por tabla, un helper unificado en frontend y campos de traducción en el panel admin.

## Estrategia

- **Schema**: agregar una columna `<campo>_i18n JSONB` (forma `{ "es": "...", "en": "..." }`) **al lado** de cada campo textual traducible. El campo original ES se mantiene como fuente de verdad / fallback para no romper nada.
- **Lectura**: helper `getI18nField(row, "title")` que devuelve `row.title_i18n?.[lng] || row.title`.
- **Escritura admin**: cada formulario gana tabs "ES / EN" para los campos traducibles. El admin puede dejar EN vacío y el sitio caerá al ES.
- **Reactividad navbar**: arreglar `translateNavLabel` para que re-renderice usando `useTranslation()` dentro del componente.

## Alcance por tabla y campos

| Tabla | Campos traducibles |
|---|---|
| hero_content | title, subtitle, description, cta_primary, cta_secondary, badge_text |
| services | title, description, short_description, features |
| machinery | name, description, category, specifications |
| vehicles | name, description, category, features |
| projects | title, description, category, location |
| blog_posts | title, excerpt, content, category |
| testimonials | name_role, content, project |
| about_content | title, subtitle, mission, vision, values, story |
| team_stats | label (los números no se traducen) |
| company_benefits | title, description |
| job_positions | title, description, requirements, responsibilities, location, type |
| navigation_links | label (ya cubierto por el mapa, pero unificamos) |
| contact_info | address, hours_label, etc. |
| social_links | label |
| site_settings | textos visibles |
| response_templates | (solo uso interno admin → fuera de alcance) |

## Fases

### Fase 1 — Base e infraestructura
1. Migración SQL única: añadir `<campo>_i18n JSONB DEFAULT '{}'::jsonb` a todas las tablas/campos de arriba. Sin breaking changes (columnas nuevas, nullable-friendly).
2. Backfill: por cada fila, `UPDATE ... SET title_i18n = jsonb_build_object('es', title)` para sembrar el ES actual.
3. Crear `src/lib/i18n-content.ts` con:
   - `getI18nField<T>(row, key, lng?)` (acepta string o array JSON).
   - `setI18nField(current, lng, value)` para los formularios admin.
   - Hook `useI18nField()` que se suscribe a cambios de idioma.
4. Arreglar `Navbar.tsx`: usar `const { i18n } = useTranslation()` para que `translateNavLabel` re-renderice.

### Fase 2 — Frontend público
Sustituir lecturas directas (`item.title`, `service.description`, etc.) por `getI18nField(item, "title")` en los componentes de listado / detalle:
- Hero, Services, Machinery (lista + modal), Vehicles (lista + modal), Projects, Blog (lista + post), Testimonials, About, Footer, Careers, Contact, navegación dinámica.

### Fase 3 — Panel admin
Añadir un componente reutilizable `<I18nField label kind="input|textarea" value={row.title_i18n} fallback={row.title} onChange=... />` con tabs ES/EN, y reemplazar los inputs correspondientes en:
- AdminHero, AdminServices, AdminMachinery, AdminVehicles, AdminProjects, AdminBlog, AdminTestimonials, AdminAbout, AdminTeamStats, AdminBenefits, AdminJobPositions, AdminNavigation, AdminContact, AdminSocialLinks, AdminSiteSettings.

Los `INSERT/UPDATE` se mantienen escribiendo ambos: el campo ES original y `<campo>_i18n` (para que listados antiguos y SEO sigan funcionando).

## Detalles técnicos

- **Tipos**: tras la migración se regeneran los tipos de Supabase, así que el helper se tipa como `(row: Record<string, any>, key: string) => string`.
- **Arrays JSON** (features, requirements): el `*_i18n` guarda `{ es: string[], en: string[] }`; el helper detecta el tipo del fallback.
- **SEO / slugs**: los slugs permanecen en ES por ahora (no rompemos URLs). Solo cambia el texto visible.
- **Sin edge functions ni cambios de RLS**: las columnas heredan políticas existentes.

## Verificación

- Playwright: cargar `/`, `/services`, `/machinery`, `/blog`, cambiar a EN con el toggle, verificar que cambian textos dinámicos.
- Admin: editar un servicio en EN, recargar como EN público, verificar persistencia.

## Entregables por turno

Dada la magnitud, propongo ejecutar **Fase 1 ahora** (migración + helper + fix Navbar). Tras aprobar la migración, en el siguiente turno hago Fase 2 (frontend público) y luego Fase 3 (admin). Cada fase queda funcional sin la siguiente (fallback al ES).
