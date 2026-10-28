# AgriOrbit English + Tamil support

This build adds a global bilingual foundation without changing Supabase table names,
API routes, survey storage, or existing A–P logic.

## Current behavior

- A floating `EN / தமிழ்` language switch is available throughout the app.
- The selected language is persisted in localStorage under `agriorbit-language`.
- `html[lang]` changes between `en` and `ta`.
- A MutationObserver applies translations to dynamic React content.
- Common navigation, authentication, farmer/field labels, survey section headings,
  many survey labels, admin labels, statuses, prompts, and common errors have Tamil
  translations.
- User-entered farmer/survey data is not translated.
- Textareas are intentionally excluded from automatic translation so entered data
  is never overwritten.

## Important next refinement

For a production-quality bilingual implementation, replace/augment the DOM fallback
with explicit translation keys in reusable components and survey question metadata.
The current layer is intentionally non-invasive so the existing working A–P flow,
offline behavior, Supabase integration, and routes remain intact while Claude can
continue the comprehensive UI/i18n refactor.
