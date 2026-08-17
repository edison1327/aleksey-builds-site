# Plan: Sincronización de Logos en Admin y Revisión de Responsividad

El objetivo es asegurar que el logo configurado en "Logo & Sitio" se muestre correctamente en el encabezado del panel de administración (`/admin`) y que todos los logos (Navbar y Footer) se comporten correctamente en móviles y computadoras, respetando los temas claro y oscuro.

## Cambios propuestos

### 1. Panel de Administración (`/admin`)
- **Actualizar `src/pages/Admin.tsx`**: 
    - Implementar lógica de selección de logo sensible al tema (usando `resolvedTheme`).
    - Priorizar `logo_url_dark` cuando el modo oscuro esté activo.
    - Asegurar que el logo se actualice tanto en el sidebar de escritorio como en el header móvil.

### 2. Revisión de Responsividad y Temas
- **Optimizar `src/components/Navbar.tsx`**:
    - Verificar que el logo móvil (incluyendo el `LogoMark` cuando hay scroll) respete las proporciones y la visibilidad del tema.
- **Optimizar `src/components/Footer.tsx`**:
    - Asegurar que el filtro `brightness-0` solo se aplique cuando no hay un logo personalizado y el tema sea claro, evitando conflictos visuales con logos cargados por el usuario.

## Detalles técnicos
- Se utilizará el hook `useTheme` para detectar el tema activo (`resolvedTheme`).
- Se mantendrán los fallbacks a los assets locales (`logo-aleksey-light.png` y `logo-aleksey.png`) para garantizar que el sitio nunca se vea roto.
- En el panel de admin, se ajustarán las clases de Tailwind (`h-8`, `h-7`, `object-contain`) para mantener la consistencia visual.

## Validación
- Verificación manual en el preview cambiando entre modo claro/oscuro.
- Simulación de dispositivos móviles para validar la visibilidad del logo en el header móvil de admin.
