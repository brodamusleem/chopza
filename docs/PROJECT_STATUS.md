# Chopza Project Status

**Snapshot:** 2026-10-15. This report describes the current working tree, including its existing uncommitted changes. No application code was changed to prepare it. Deployment, a live Supabase project, and real multi-user/browser behavior were not accessible here; those items are marked **unverified**.

## 1. TECH STACK

Versions below are resolved, installed versions from `npm ls --depth=0` (the package manifest uses ranges).

| Dependency | Installed version |
|---|---:|
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Vite | 8.3.0 |
| Tailwind CSS / `@tailwindcss/vite` | 4.3.3 / 4.3.3 |
| shadcn CLI package | 4.21.0 |
| React Router (`react-router`) | 7.18.3 |
| Supabase JS | 2.116.0 |
| Leaflet / React Leaflet | 1.9.4 / 5.0.0 |
| Zustand | 5.0.15 |
| React Hook Form / resolvers | 7.88.0 / 5.9.1 |
| Zod | 4.6.4 |
| Axios | 1.20.0 |
| Recharts | 3.8.0 |
| date-fns | 4.4.0 |
| Vitest | 5.0.0 |
| ESLint | 10.10.0 |

The generated shadcn-style UI files in `src/shared/components/ui` are: alert-dialog, avatar, badge, button, calendar, chart, dialog, dropdown-menu, form, input, label, popover, select, sheet, sidebar, skeleton, sonner, switch, table, tabs, textarea. This is a checked-in component set, not proof that every component is used.

## 2. ROUTES

“Public” means the router adds no role/session guard. Layout gates can redirect based on account application status. “Partly built” means a UI/data path exists but an important workflow is incomplete, or its live operation is unverified.

| Route | Access gate | Page component | Status |
|---|---|---|---|
| `/` | Public | `HomePage` | Partly built; interactive greeting and storefront entry are present; end-to-end checkout is absent. |
| `/cart` | Public | `CartPage` | Partly built; cart state/UI exists. |
| `/checkout` | Public | `CheckoutPage` | Partly built; order API explicitly throws and creates no order/payment. |
| `/orders/:id/track` | Any signed-in session (`RoleGuard` without role list) | `TrackingPage` | Partly built; reads order/status and live channels; real broadcast configuration unverified. |
| `/company` | Public | `CompanyPage` | Partly built marketing page. |
| `/vendors` | Public | `VendorsMarketingPage` | Partly built marketing page. |
| `/riders` | Public | `RidersMarketingPage` | Partly built marketing page. |
| `/login` | Public | `LoginPage` | Built UI and Supabase auth call; live auth unverified. |
| `/register` | Public | `RegisterPage` | Built UI and Supabase auth call; live auth unverified. |
| `/register/vendor` | Public | `VendorSignupPage` | Partly built; account signup then vendor application flow. |
| `/register/rider` | Public | `RiderSignupPage` | Partly built; account signup then rider application flow. |
| `/admin/dashboard` | Admin only | `AdminDashboardPage` | Partly built; dashboard includes hardcoded sample orders/vendors. |
| `/admin/vendors` | Admin only | `AdminVendorsPage` | Partly built; queue/list and approval actions implemented against Supabase. |
| `/admin/vendors/:vendorId` | Admin only | `AdminVendorDetailPage` | Partly built; live query/action paths exist; live behavior unverified. |
| `/admin/riders/applications` | Admin only | `AdminRiderApplicationsPage` | Partly built; approval queue and actions implemented. |
| `/admin/riders/:riderId` | Admin only | `AdminRiderDetailPage` | Partly built; query/action paths exist. |
| `/admin/riders` | Admin only | `AdminRidersPage` | Partly built; rider list implemented. |
| `/admin/orders` | Admin only | `AdminOrdersPage` | Partly built; order table/query exists. |
| `/admin/teams` | Admin only | `AdminTeamsPage` | Partly built; admin listing exists, invitation calls missing edge function. |
| `/admin/dispatch` | Admin only | `AdminDispatchPage` | Partly built; dispatch map/list exists. |
| `/admin/reports` | Admin only | `ComingSoonPage` | Coming soon placeholder. |
| `/admin/settings` | Admin only | `AdminSettingsPage` | Partly built; settings, service areas, profile flows; admin invite function unavailable in repo. |
| `/vendor/onboarding` | Vendor role; app-status gate | `VendorOnboardingPage` | Partly built; submission/upload path exists. |
| `/vendor/pending-review` | Vendor role; pending applicants | `VendorApplicationStatePage` | Built application-state screen. |
| `/vendor/application-rejected` | Vendor role; rejected applicants | `VendorApplicationStatePage` | Built application-state screen/resubmission. |
| `/vendor/application-status` | Vendor role; suspended applicants | `VendorApplicationStatePage` | Built application-state screen. |
| `/vendor/dashboard` | Approved vendor only | `VendorDashboardPage` | Partly built; live summary queries; chart dates/data include generated seven-day labels. |
| `/vendor/orders` | Approved vendor only | `VendorOrdersPage` | Partly built; status-event writes exist; live operation unverified. |
| `/vendor/menu` | Approved vendor only | `VendorMenuPage` | Partly built; CRUD UI exists, but image bucket is not provisioned in migrations. |
| `/vendor/settings` | Approved vendor only | `VendorSettingsPage` | Partly built; profile/open status update paths. |
| `/vendor/payouts` | Approved vendor only | `VendorComingSoonPage` | Coming soon placeholder. |
| `/vendor/reviews` | Approved vendor only | `VendorComingSoonPage` | Coming soon placeholder. |
| `/vendor/promotions` | Approved vendor only | `VendorComingSoonPage` | Coming soon placeholder. |
| `/rider/onboarding` | Rider role; application gate | `RiderOnboardingPage` | Partly built; application submission exists. |
| `/rider/dashboard` | Approved rider only | `RiderDashboardPage` | Partly built; summary/query paths exist. |
| `/rider/jobs` | Approved rider only | `RiderJobsPage` | Partly built; claim path exists but depends on DB RPC/schema. |
| `/rider/active` | Approved rider only | `RiderActiveDeliveryPage` | Partly built; status and location paths exist. |
| `/rider/history` | Approved rider only | `RiderHistoryPage` | Partly built; query exists. |
| `/rider/settings` | Approved rider only | `RiderSettingsPage` | Partly built; profile/settings writes exist. |
| `/rider/payouts` | Approved rider only | `RiderComingSoonPage` | Coming soon placeholder. |
| `/rider/ratings` | Approved rider only | `RiderComingSoonPage` | Coming soon placeholder. |
| `*` (not-found) | Public | `NotFoundPage` | Built fallback screen. |

## 3. FEATURES BY ROLE

**Admin**

- Works in code: guarded admin area; vendor and rider queues/lists/detail pages; order list; dispatch screen; platform settings and service-area CRUD calls.
- Partly built: dashboard includes sample rows; admin team page lists profiles but inviting relies on absent `invite-admin`; demotion attempts a profile role update that the current profile update policy may allow only according to RLS and is unsafe as a role-management design.
- Missing: reports, and any verified live integration/deployment evidence. Financial/payment administration is not present.

**Vendor**

- Works in code: application and status screens, rejected application resubmission RPC, menu CRUD calls, order status-event updates, open/closed toggle, dashboard queries.
- Partly built: image upload, order workflow, and dashboard depend on live schema, grants, realtime, and storage configuration that were not verified. Status changes have a DB trigger lock but general own-row/profile writes need tightening (see Security).
- Missing: payouts, reviews, promotions; order completion has no payment workflow.

**Rider**

- Works in code: application UI, admin approval/list paths, online toggle, available-job query, claim RPC, status and location broadcasting UI/code.
- Partly built: claim/job flow depends on migrations being applied and matching current schema; browser GPS, realtime presence, and two-user concurrency were not exercised.
- Missing: payouts and ratings.

**Customer**

- Works in code: vendor/menu browsing queries, cart state, checkout form, tracking screen/status subscription implementation.
- Partly built: tracking depends on a signed-in session and realtime setup. Cart/checkout UI is not a completed purchase flow.
- Missing: order creation (explicitly throws), server-side price calculation/order splitting, payment processing, customer order history/account pages, review flow.

**Public pages**

- Works in code: home and company/vendor/rider marketing pages, login/register interfaces, not-found screen.
- Partly built: content and live branding/runtime behavior have not been checked in a real browser. Public vendor browsing requires Supabase configuration.
- Missing: any deployment evidence and verified public production experience.

## 4. DATABASE

There are 12 ordered migration files. The repository contains no migration ledger, remote connection output, or successful `supabase db push`/`migration list` evidence. **Whether any migration has been applied to the live project is unverified for every file.**

| Order | Migration | Schema effect in source |
|---:|---|---|
| 1 | `0001_init.sql` | `user_role`, `vendor_status`, `order_status`; profiles/vendors/menu_items/orders/order_items/order_status_events; baseline RLS, status-event trigger/function, indexes. |
| 2 | `0002_auto_create_profile.sql` | `handle_new_user` profile creation function and auth-user trigger. |
| 3 | `0003_fix_admin_rls_recursion.sql` | Replaces recursion-prone admin/parent-row policies using the admin helper. |
| 4 | `0004_add_order_location_tracking.sql` | Adds order delivery/rider location columns; exact alterations recorded in file. |
| 5 | `0005_add_platform_settings.sql` | `platform_settings`, seeded singleton row, RLS and policies. |
| 6 | `0006_settings_expansion.sql` | Settings fields, `service_areas`, profile notification preferences, `is_admin()` and admin policies. |
| 7 | `0007_vendor_onboarding_and_status_lockdown.sql` | Vendor rejected status/service-area link, status guard and resubmit RPC, `vendor-logos` bucket and storage policies. |
| 8 | `0008_sync_vendor_signup_roles.sql` | Auth-user profile/role synchronization trigger/function. |
| 9 | `0009_add_profile_email_for_admin_details.sql` | Profile email column. |
| 10 | `0010_order_status_events_insert_policies.sql` | Adds `ready_for_pickup` to order enum and status-event insert policies for vendor/rider/admin. |
| 11 | `0011_add_vendor_open_status_and_menu_category.sql` | Vendor `is_open` and menu category additions. |
| 12 | `0012_riders_onboarding_and_claim.sql` | `rider_status`, `riders`, rider status guard/reapply and claim RPCs, rider order visibility policy/indexes. |

**Tables found/expected by code:** `profiles`, `vendors`, `menu_items`, `orders`, `order_items`, `order_status_events`, `platform_settings`, `service_areas`, `riders`, plus Supabase-managed `storage.objects`.

**Enums:** `user_role` (`customer`, `vendor`, `rider`, `admin`); `vendor_status` (pending, approved, suspended, then rejected); `order_status` (pending, accepted, preparing, ready_for_pickup, rider_assigned, picked_up, in_transit, delivered, cancelled); `rider_status` (pending, approved, rejected, suspended).

**Functions/triggers depended on:** `is_admin`; `handle_new_order_status_event` / `on_order_status_event_insert`; auth-user profile creation/sync (`handle_new_user`, `on_auth_user_created`, with later migration replacing/updating behavior); `prevent_non_admin_status_change` / `enforce_vendor_status_change` and `enforce_rider_status_change`; `resubmit_vendor_application`; `resubmit_rider_application`; `claim_delivery`. Exact function behavior is in migration SQL; deployment is unverified.

**Notable schema mismatch:** `0012` uses `ready_for_pickup`, which `0010` adds, so rider claim requires both migrations. Current source types list it. The code also references `menu-item-images`, but no migration creates that bucket. `settings.api.ts` invokes `invite-admin`, but there is no corresponding edge function.

## 5. EDGE FUNCTIONS AND STORAGE BUCKETS

- `supabase/functions` does not exist in this checkout. No edge function implementation or local deployment evidence exists.
- Code invokes `invite-admin` through Supabase Functions; implementation/deployment is **unverified** and absent from this repo.
- Migration `0007` inserts the public `vendor-logos` bucket and policies for reading and authenticated owner-folder uploads. Whether this ran live is **unverified**.
- Vendor menu image code expects `menu-item-images`; no migration/config declaration creates it. Availability and policies are **unverified**.
- Admin settings uploads via a passed bucket name; the repo does not establish all bucket names/policies that caller might use.

## 6. ENVIRONMENT VARIABLES

Only names are listed. No values from `.env.local` are included.

| Variable | Required? | Use |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes for Supabase-backed features | `src/shared/lib/supabaseClient.ts`; Supabase project API URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes for Supabase-backed features | `src/shared/lib/supabaseClient.ts`; browser publishable key. |
| `VITE_API_BASE_URL` | No | `src/shared/lib/axiosClient.ts`; optional non-Supabase HTTP base URL. |
| `OPENAI_API_KEY` | Not required by frontend; only if local Studio integration is enabled | Referenced in `supabase/config.toml`. |
| `SENDGRID_API_KEY` | Not required by current frontend; only if the commented SMTP setup is enabled | Commented SMTP setting in `supabase/config.toml`. |
| `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` | Not required; SMS provider is disabled in config | Twilio Auth setting in `supabase/config.toml`. |
| `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` | Not required; Apple auth is disabled | Apple provider setting in `supabase/config.toml`. |
| `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Not required; experimental storage backend config | `supabase/config.toml`. |

The app checks the Supabase key prefix and can start with `supabase === null`; Supabase-backed calls then fail through `requireSupabase()`. The required app variables are also documented in README. `.env.local` exists locally but is not reproduced here.

## 7. QUALITY STATUS

Commands were run against the current working tree on 2026-10-15.

| Command | Observed result |
|---|---|
| `npm run build` | Failed in TypeScript before Vite ran: **1 TypeScript error**. `src/app/components/AnimatedGreeting.tsx:44`: `greeting.dir` is not present on all members of the inferred greeting union. |
| `npm run lint` | **Unverified count.** Command was started, produced no diagnostics or completion after waiting, and had to be interrupted to continue. It did not yield an exit status, so no honest lint error/warning count is available. |
| `npm test` | Failed at Vitest startup before tests ran: Vite config bundling reports `Error: spawn EPERM` while resolving `vitest.config.ts`. **0 tests executed; test assertion failure count is 0; startup failure count is 1.** Test-suite pass/fail counts are unverified because collection never started. |

## 8. KNOWN ISSUES

- `AnimatedGreeting.tsx` compile error above. The same file contains mojibake in several non-English greeting strings as read from disk.
- `features/ordering/api/orders.api.ts` explicitly throws “Order placement is not connected yet”; no order or payment is created by checkout.
- `AdminDashboardPage.tsx` contains sample orders/vendors and renders sample vendors; dashboard content is partly demo data.
- `menu-item-images` is used by upload code but is not created by any migration.
- `invite-admin` is invoked but no edge-function source exists.
- `profiles` self-update policy has no column restriction/check, while client settings updates accept profile fields and admin demotion writes `role`. This creates a role-escalation risk described below.
- Baseline RLS would allow a customer client to insert order/item data and choose totals/unit prices; the current checkout API does not use that route and instead throws. No server pricing validation appears in the migrations.
- Two `as unknown as` casts exist in `src/features/admin/api/admin.api.ts` (around lines 62 and 175). Search found no `as any`, `@ts-ignore`, `@ts-expect-error`, eslint-disable, TODO, or FIXME markers in `src`.
- `DispatchSimulator.tsx` uses `Math.random()` to move a simulated marker; this is demo movement, not real GPS evidence.
- No browser session, production login, two-user claim race, real GPS permission/device, hosted Realtime, remote migration ledger, or deployed bucket/function was verified.
- No `supabase/functions` folder exists. `supabase/config.toml` points to `./seed.sql`, but no seed file is present in the listed repo files.
- Numerous tracked source files and README are already modified and there are untracked new route/page files at report time. This report did not review their history or infer the intended final changes.
- Lint execution did not return; exact lint diagnostics/count are unverified.

## 9. SECURITY CHECK

This is a review of policies present in migration source, not a claim about live RLS state. A table with `ENABLE ROW LEVEL SECURITY` in SQL is marked enabled in source; live application remains unverified.

| Table | RLS in migration source? | Client-controlled writes / concern |
|---|---|---|
| `profiles` | Yes | **High risk:** users can update their entire own row; policy has no `WITH CHECK` or column restrictions. `role` and other fields can potentially be self-assigned. Admin role changes are also issued through this client table. |
| `vendors` | Yes | Owner insert is restricted to own vendor + vendor role + pending; status-change trigger blocks non-admin status changes except resubmission. Owner update policy otherwise allows non-status business fields such as coordinates, name and service area, subject to the row policy's owner check. |
| `menu_items` | Yes | Vendor-owner `FOR ALL` policy allows vendor-controlled menu fields including price/availability/image/category. Appropriate for catalog editing, but submitted order prices must not be trusted. |
| `orders` | Yes | Customer insert check only checks `customer_id`; no DB-side authoritative pricing/total validation appears in migrations. Vendor/rider/admin update policies are row-level broad, not column-limited. Rider claim RPC is atomic, but ordinary update policy could permit rider/order fields beyond intended status if the row matches. |
| `order_items` | Yes | Customer insert only verifies parent order belongs to caller; client controls `menu_item_id`, `quantity`, and `unit_price` subject to simple positivity checks. |
| `order_status_events` | Yes | Insert policies are role/relationship based; callers supply status and note. Trigger mirrors event status to order. Review transition validation and actor-specific allowed statuses before treating this as trusted audit data. |
| `platform_settings` | Yes | Admin-only update policy; any admin may control fee/maintenance/branding settings, expected for this role. No server-side protection of `updated_by` was found in policy. |
| `service_areas` | Yes | Admin `FOR ALL`; admins control name and active state as intended. |
| `riders` | Yes | Rider insert constrained to own owner, pending, offline. Rider owner update policy allows their own row without column restrictions; trigger protects status, but online state/vehicle fields are client controlled (some are intended). |
| `storage.objects` | Supabase-managed RLS is assumed by policies; live state unverified | `vendor-logos` upload policy requires authenticated user and first path segment = user id; public read. No menu image bucket policy found. |

Key trust boundaries to repair: protect `profiles.role`; calculate order totals and item prices server-side from current menu records; constrain updates to permitted columns/transitions; define and test storage rules for every used bucket. Never treat browser role checks as DB authorization.

## 10. DEVIATIONS

Earlier instructions or acceptance criteria are not present in the repository material inspected for this report, so comparison against them is **unverified**. Directly observable departures from a complete food ordering/dispatch implementation include: checkout has no order/payment creation; reports, payouts, reviews and promotions are placeholders; sample admin dashboard data remains; admin invitation depends on an absent function; and menu image storage is expected without a corresponding bucket migration.

## 5 riskiest things right now

1. Profile RLS permits unrestricted self-row updates, including a likely path to changing `role`.
2. Customer-controlled order totals and item prices are accepted by client insert policies; checkout currently does not transact server-side.
3. Build is blocked by a TypeScript error; test runner cannot start in this environment; lint result is unavailable.
4. Rider dispatch depends on migrations/RPCs and real Realtime/GPS behavior that have not been verified on a live project.
5. Admin invitation and menu-image upload paths refer to capabilities not provisioned in the repository (`invite-admin`, `menu-item-images`).
