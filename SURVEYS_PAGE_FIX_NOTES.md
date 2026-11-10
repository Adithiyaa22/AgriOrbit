# AgriOrbit Surveys Page Fix

## Changes
- The Surveys page now combines Supabase survey records with local IndexedDB survey drafts.
- Local-only surveys remain visible on the device where they were created, including their local survey code and cached farmer/field labels when available.
- Unsynced Section A GPS and internet values are reflected in the list.
- A locally saved final submission in Section P is reflected as submitted while it waits for sync.
- Desktop survey rows now include an Open survey action; mobile cards include an Open survey and sections action.
- Survey data refreshes when the page regains focus/visibility and can also be refreshed manually.
- Failure to load related farmer/field/profile labels no longer discards survey rows that were successfully fetched.

## Important
- Offline-only records are stored in the browser's IndexedDB. They are visible only on the same browser/device until successfully synced to Supabase.
- If the online `surveys` query itself returns no rows on another device, verify the Supabase `surveys` table data and Row Level Security SELECT policies for the logged-in role. Client-side code cannot bypass RLS.
- `.env.local`, `node_modules`, and `.next` are intentionally excluded from this ZIP. Keep your existing environment variables locally and in the hosting provider.
