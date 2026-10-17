# AgriOrbit — Final Offline Testing Checklist

This project update keeps the existing Supabase schema intact. No destructive Supabase migration is required for the offline changes.

## What was updated

- Offline farmer/field reference caching using Dexie.
- Offline survey creation can use cached farmers and fields.
- Offline authentication lookup uses the locally stored Supabase session when the browser has no network.
- Section A now preserves the survey IDs required by the sync process.
- Section A stores GPS latitude/longitude in the existing `surveys` columns.
- Section A has a real browser GPS capture action.
- Section B can recover its survey context from Section A when the survey was started offline.
- Existing Section C–O offline drafts continue to use the current table structure.
- Survey sync now maps Section A's UI fields to the real `surveys` column names.
- Offline sync no longer sends the local `survey_id` metadata into normal table updates.
- Section P can queue a confirmed submission while offline.
- Section P will not submit to Supabase until earlier survey sections have synchronized successfully.
- Photo and voice queues continue to upload after reconnection.
- Uploaded media queue records are cleaned after successful upload.
- Offline sync runs on application load, connection recovery, tab visibility, and a 30-second retry interval.
- A service worker is registered for basic offline page/app-shell recovery.

## Supabase changes

No database migration was added by this update.

The existing tables used by the application remain the source of truth. Run `SUPABASE_VERIFICATION.sql` in Supabase SQL Editor if you want a read-only pre-test check of the expected columns, foreign keys, storage buckets, and RLS policies.

## Final test sequence

### Test 1 — Normal online survey

1. Log in as an intern.
2. Open New Survey.
3. Select a farmer and field.
4. Start the survey.
5. Complete A through O.
6. Capture GPS in A.
7. Add at least one photo and one voice recording where the sections support them.
8. Reach P.
9. Confirm every required section is complete.
10. Submit.
11. Confirm the survey status becomes `submitted` in Supabase.
12. Confirm `submitted_at` is populated.

### Test 2 — Offline continuation

1. While online, open New Survey and select a farmer and field.
2. Start the survey.
3. Confirm the farmer and field are cached.
4. Turn off internet/network access.
5. Complete A through O.
6. Save a photo and a voice recording while offline.
7. Refresh only if the browser has already cached the required page.
8. Open Drafts.
9. Confirm the survey appears as an offline draft.
10. Open P.
11. Confirm the local section checklist is shown.
12. Submit while offline.
13. Confirm the submission is shown as pending synchronization.

### Test 3 — Reconnection

1. Restore internet access.
2. Keep the AgriOrbit application open.
3. Wait for the automatic sync or trigger it from Drafts.
4. Confirm the survey row exists in Supabase.
5. Confirm Sections A–O have synchronized.
6. Confirm the survey becomes `submitted` only after the earlier sections sync.
7. Confirm queued photos appear in `photos` and their storage files exist.
8. Confirm queued voice recordings appear in `voice_notes` and their storage files exist.
9. Confirm the offline media queue is cleared after successful upload.

### Test 4 — Failure recovery

1. Start or edit a survey offline.
2. Restore internet but intentionally make one required Supabase operation unavailable (for example, test with an account that lacks the required RLS permission).
3. Confirm the local section becomes `sync_failed` instead of being lost.
4. Restore the permission/network condition.
5. Retry sync.
6. Confirm the section becomes `synced`.
7. If P was queued, confirm it waits until earlier sections succeed.

## Important browser note

Browser geolocation requires the browser to allow location access. The GPS capture button stores the coordinates in the existing `surveys.gps_latitude` and `surveys.gps_longitude` columns.

## Important replacement note

Keep your existing `.env.local` file. It is intentionally not included in the replacement archive so your Supabase credentials/configuration are not overwritten.
