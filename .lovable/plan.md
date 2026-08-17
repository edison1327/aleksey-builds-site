# Plan - Independent Logo Management (Home, Footer, Dark/Light Mode)

The objective is to allow independent logo configuration for the Header (Home/Nav) and Footer, with specific support for Light and Dark modes for each.

## Proposed Changes

### Database Schema
- Update `site_settings` table to include:
  - `logo_url_dark`: Specific logo for dark mode in the Navbar.
  - `footer_logo_url`: Specific logo for the footer.
  - `footer_logo_url_dark`: Specific logo for dark mode in the footer.

### Frontend Components

#### Navbar (`src/components/Navbar.tsx`)
- Update logic to select the logo based on `resolvedTheme` and the new `logo_url` / `logo_url_dark` fields.
- Priority:
  1. `siteSettings.logo_url_dark` (if theme is dark)
  2. `siteSettings.logo_url` (if theme is light or if dark version is missing)
  3. Fallback assets.

#### Footer (`src/components/Footer.tsx`)
- Update logic to select the footer logo.
- Priority:
  1. `siteSettings.footer_logo_url_dark` (if theme is dark)
  2. `siteSettings.footer_logo_url` (if theme is light or if dark version is missing)
  3. `siteSettings.logo_url` (if footer-specific is missing)
  4. Fallback assets.

#### Admin Dashboard (`src/components/admin/AdminSiteSettings.tsx`)
- Add new fields to the "Logo & Sitio" administration panel to allow uploading:
  - Navbar Logo (Light)
  - Navbar Logo (Dark)
  - Footer Logo (Light)
  - Footer Logo (Dark)

## Technical Details
- **SQL Migration**: Add columns to `public.site_settings`.
- **Hooks**: Update `useSiteSettings.tsx` to include new fields in types (if not auto-updated by schema changes).
- **Assets**: Keep existing PNG fallbacks but allow full customization via URL.

## Verification Plan
- Check Navbar logo in Light and Dark mode.
- Check Footer logo in Light and Dark mode.
- Verify that changes in the Admin panel persist correctly to the database.
