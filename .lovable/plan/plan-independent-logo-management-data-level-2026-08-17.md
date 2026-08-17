# Plan - Independent Logo Management (Data Level)

The user wants to ensure that each logo (Navbar Light/Dark, Footer Light/Dark) can be uploaded and managed independently in the CMS. While the UI and schema have been implemented, I need to verify if there's any hardcoded behavior or missing data synchronization that prevents the "upload your own logo for each" requirement from being fully realized.

## Technical Details

- **Database**: The `site_settings` table already has the necessary columns: `logo_url`, `logo_url_dark`, `footer_logo_url`, and `footer_logo_url_dark`.
- **Admin UI**: `AdminSiteSettings.tsx` has been updated to provide four separate `ImageUpload` fields mapping to these columns.
- **Components**: `Navbar.tsx` and `Footer.tsx` have logic to select the appropriate URL based on the theme and specific footer overrides.
- **Consistency**: I will check the Homepage (`Index.tsx` / `Hero.tsx`) to see if it uses a specific "Home Logo" or if it just relies on the Navbar. The user mentioned "menu home has its own logo", which might imply they want the Navbar logo on the Home page to be different from other pages, or simply that the Navbar logo (which is the "home" menu entry point) is independent.

## Proposed Changes

### Database & Types
- No changes needed to the schema (already done).
- Ensure `src/integrations/supabase/types.ts` is up to date (auto-generated, but I'll verify the properties are recognized in the components).

### Admin CMS
- Refine `AdminSiteSettings.tsx` to ensure clear labeling:
    - Navbar Logo (Light Mode)
    - Navbar Logo (Dark Mode)
    - Footer Logo (Light Mode)
    - Footer Logo (Dark Mode)

### Frontend Components
- **Navbar**: Verify it uses the specific Navbar logo fields.
- **Footer**: Verify it uses the specific Footer logo fields and **removes** the `brightness-0 invert` CSS filter if a specific footer logo is provided, as the user is uploading a dedicated asset for it.
- **Home Page**: Check if a specific "Home-only" logo override is needed. If the user wants the Home page to have a different logo than the rest of the site's navbar, I will add a `navbar_home_logo_url` field. However, usually "menu home" refers to the Navbar. I will stick to the 4-logo model unless further clarified.

### Refinement
- Update `Footer.tsx` to stop forcing `brightness-0 invert` when a custom `footer_logo_url` is present, as that filter was a hack for when only the main logo was available.
