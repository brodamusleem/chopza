# Admin dashboard integration status

The dashboard UI is at `/admin/dashboard`, guarded by the existing trusted `app_metadata.role === 'admin'` check. It has four stat cards, one seven-day orders chart, and tabs for vendor approvals, all vendors, and read-only recent orders. All available primitives use installed shadcn components.

## Live data integration

The admin API reads the live `profiles`, `vendors`, and `orders` tables through the typed Supabase client. Vendor approval writes `approved`, while rejection writes the distinct `rejected` status. Orders use the explicit `orders_customer_id_fkey` profile relationship, and all amounts are displayed as plain Naira values without unit conversion.

The browser still needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, plus an authenticated admin session. The local test suite mocks API calls and does not substitute for a live approval check. Never use editable user metadata as a privilege source; authorization remains server-managed through the profile/app metadata role.

## Implemented UI behavior

- Vendor search/status filters apply immediately on the loaded list. Pending vendor search is client-side too.
- Orders status/date controls react immediately and pass filters to the query hook. The intended backend query returns the most recent 100 matching rows, visibly disclosed in the UI, with no Apply button.
- Mutations have disabled/spinner states and success/error toasts. On successful backend completion, the page consistently refetches the queue, vendor list, and stats.
- Query hooks expose `data`, `isLoading`, `error`, `refetch`, and prevent older responses from overwriting newer filter results.
- Loading tables/cards/charts use Skeleton; empty tables and query errors have distinct states.
- Date utilities use Africa/Lagos boundaries and zero-fill seven days. Future order queries should use inclusive start / exclusive next-day end bounds.

Installed shadcn additions: `table`, `chart`, `popover`, `calendar` (and CLI-required shared component updates). Existing Card, Badge, Input, Select, Button, Tabs, Skeleton and Sonner are reused.

Tests use mocked API functions to verify mutation feedback/refresh behavior, loading concurrency and timezone boundaries. They are not evidence of live Supabase integration.
