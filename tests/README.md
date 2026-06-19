# Tests

Not covered by unit tests in v3:

- `useCursor.ts`: caret placement depends on `getBoundingClientRect`, which jsdom cannot model reliably.
- Full `TypingEngine.vue` layout behavior: depends on DOM layout; core typing state and WPM logic are covered by composable tests.
- `SupabaseAdapter.ts`: real Supabase/RLS/network behavior is excluded from unit coverage and should be covered by future integration tests.
