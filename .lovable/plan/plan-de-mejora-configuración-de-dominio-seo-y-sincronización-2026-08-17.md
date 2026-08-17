# Plan de Mejora: Configuración de Dominio, SEO y Sincronización de Marca

Este plan aborda la configuración del dominio `aleksey.com.pe`, la optimización SEO (canonical, favicon) y la verificación de la sincronización visual de los logos en todos los entornos (público y admin) y modos (claro/oscuro).

## Tareas

### 1. Configuración de Dominio y SSL
- Registrar y verificar el dominio `aleksey.com.pe` en la infraestructura de Lovable.
- Asegurar la generación y propagación del certificado SSL para evitar fallos en la previsualización y el sitio en vivo.

### 2. Sincronización de Marca en el CMS
- Actualizar la tabla `site_settings` en el CMS con el dominio principal `https://aleksey.com.pe`.
- Verificar que el **favicon** y el **logo** cargados en el panel de administración se reflejen correctamente en el sitio público.

### 3. Optimización SEO
- **Etiquetas Canonical**: Asegurar que todas las páginas apunten a `https://aleksey.com.pe` como URL canónica para evitar contenido duplicado.
- **Favicon**: Validar que el favicon configurado sea consistente en todas las páginas.

### 4. Verificación de Logos Sensibles al Tema (Modo Claro/Oscuro)
- **Navbar (Público y Admin)**:
  - Verificar que en escritorio y móvil, el logo cambie automáticamente entre la versión clara (`logo_url`) y oscura (`logo_url_dark`) al alternar el tema.
- **Footer**:
  - Validar que el footer utilice sus propios logos configurados (`footer_logo_url` y `footer_logo_url_dark`) de forma independiente.
  - Asegurar que no se apliquen filtros de color (como `brightness-0`) cuando el usuario ha subido un logo personalizado.

## Detalles Técnicos
- Se utilizarán las herramientas de Lovable Cloud para la gestión del dominio.
- Las políticas de RLS en la tabla `site_settings` permiten la lectura pública para que el SEO y el logo se carguen dinámicamente.
- El componente `SEO.tsx` centralizará la lógica de la URL canónica basada en la configuración del CMS.
