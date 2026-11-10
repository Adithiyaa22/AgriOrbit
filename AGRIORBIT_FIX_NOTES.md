# AgriOrbit survey fixes

## Included changes

- Added the existing `SurveySectionNavigation` component to all 16 survey section routes (A through P), with the current section highlighted and direct links to every other section.
- Survey list retrieval is scoped to the authenticated intern's `enumerator_id` and paginated in batches of 500.
- The survey list merges that intern's locally saved IndexedDB sections while de-duplicating records already returned by Supabase.
- Summary cards are calculated from the complete merged survey collection, not from the search/status-filtered rows.
- GPS Captured counts only records where `gps_captured === true`, matching the database flag rather than inferring capture from coordinates.

## Expected values from the supplied Supabase query

For the supplied Test Intern account:

- Total: 17
- Submitted: 3
- Drafts: 14
- GPS Captured: 6

The authenticated-role visibility test returned 17 rows, so the supplied evidence does not indicate a Row Level Security visibility problem.

## Important deployment notes

- `.env.local`, `node_modules`, `.next`, `.git`, and TypeScript build cache files are intentionally excluded.
- Keep existing Supabase environment variables in the local project and Vercel. Never commit `.env.local` or service-role/secret keys.
- The source package was statically inspected, but a Next.js production build could not be completed in this environment because dependency installation timed out. Run `npm ci` and `npm run build` locally before pushing.
