# Plan de Publicación y Verificación de Dominio

El usuario solicita publicar el sitio y verificar que el dominio canónico apunte a `aleksey.com.pe`, además de acceder a Google Search Console.

## Acciones de Usuario Requeridas

1. **Configuración de DNS**: El usuario debe asegurarse de que el dominio `aleksey.com.pe` apunte a la infraestructura de Lovable/Vercel (CNAME/A records).
2. **Google Search Console**: El usuario debe acceder a su cuenta de Search Console para verificar la propiedad. El código ya incluye la etiqueta de verificación `<meta name="google-site-verification" content="KT0ofAND818dPOibkzpc4h9Dwlpi1JdXl-K0dA5LEcM" />`.

## Tareas Técnicas

### 1. Verificación de Configuración Canónica
- Revisar que `src/components/SEO.tsx` esté utilizando `https://aleksey.com.pe` como base para todas las rutas.
- Asegurar que `index.html` tenga el enlace canónico base correcto.
- Validar que el sitemap se genere con la URL correcta.

### 2. Publicación
- Utilizar la herramienta de publicación para asegurar que la última versión esté en vivo.

### 3. Validación Post-Despliegue
- Realizar una prueba de navegación para confirmar que los tags de SEO reflejan el dominio final.

## Detalles Técnicos

- **SEO**: Se utiliza `react-helmet-async` para inyectar tags dinámicos.
- **Base URL**: Definida en `src/components/SEO.tsx` como `DEFAULT_URL`.
- **Sitemap**: Se encuentra en `public/sitemap.xml`.

---

*Nota: La publicación efectiva depende de la integración de Lovable con el proveedor de hosting.*
