# Chopza — Kano food ordering & live dispatch

Chopza is a multi-vendor food ordering and live dispatch app built with React 19, TypeScript 5, Vite 8, Tailwind CSS 4, React Router 7, Supabase, and Leaflet/OpenStreetMap.

## Run locally

Use Node 22.12+ (Node 24 LTS recommended). The lockfile pins the resolved dependency tree.

```sh
npm install
npm run dev
```

Add the Supabase values below to `.env.local` before using backend-backed features. If script execution policy blocks npm.ps1 on Windows, use `npm.cmd` instead of `npm`.

## Environment

| Variable                      | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| VITE_SUPABASE_URL             | Project API URL from Supabase dashboard           |
| VITE_SUPABASE_PUBLISHABLE_KEY | Browser publishable key beginning sb_publishable_ |
| VITE_API_BASE_URL             | Optional trusted non-Supabase HTTP API base URL   |

Every VITE_ value is public in the browser bundle. Never add a Supabase secret, Paystack key, or service-role key to .env.local. Real env files are gitignored. Restart Vite after changing env.

## Paystack test checkout

The customer checkout invokes `initialize-payment`, which calls the `create_checkout` RPC to price current menu items and initializes Paystack. Retry attempts for existing unpaid orders use `paystack-initialize`. The return page invokes `paystack-verify`; `paystack-webhook` handles asynchronous success notifications, and admins use `paystack-refund` for refunds. Checkout requires a signed-in customer with an email address and real menu item IDs from an approved, open vendor. Demo menu items cannot be checked out.

Apply all migrations in `supabase/migrations` in numeric order, through `0019_realtime_authorization.sql`. Use the Supabase CLI against the intended project (`supabase link` followed by `supabase db push`) or apply the files in order through the SQL editor. Do not apply the files out of order. Migration 0018 removes cash on delivery. Existing orders remain unpaid after that migration; review and reconcile any historical orders explicitly if they need to be visible to vendors. Migration 0019 scopes private live location broadcasts to the customer's order, its assigned rider, and admins while delivery is active.

Deploy the functions the app invokes:

```sh
supabase functions deploy paystack-initialize
supabase functions deploy initialize-payment
supabase functions deploy paystack-verify
supabase functions deploy paystack-webhook
supabase functions deploy paystack-refund
```

Set `PAYSTACK_SECRET_KEY` and `SITE_URL` in Supabase Edge Function secrets. `SITE_URL` is the app origin, such as `http://localhost:5173` for local development; checkout returns to `/checkout/verify`. Optionally set `PAYMENT_RETURN_URL` to override the full callback URL. Configure Paystack to send webhook events to `https://wkfmyoxodcoldbcfnytl.supabase.co/functions/v1/Paystack-Webhook`. Keep the Paystack secret out of `.env.local` and the browser bundle. `VITE_PAYMENT_MODE=test` only displays a test-mode notice; use Paystack test credentials in the Edge Function secret for test transactions.

Paystack's return redirect does not itself mark orders paid. `paystack-verify` checks the reference, amount, currency, and transaction status with Paystack before marking payment and grouped orders as paid. The webhook provides a second confirmation path if the redirect arrives before Paystack's notification.

Leaflet uses OpenStreetMap tiles and requires no map API key. Location sharing requires HTTPS outside localhost and explicit browser permission.

## Commands

```sh
npm run build
npm run lint
npm test
npm run format:check
npm run format
npm run preview
```

ESLint uses flat config. Prettier handles formatting. Vitest checks cart behavior, role trust boundaries, login validation, broadcast validation, and Realtime channel lifecycle. Tests mock Supabase; they do not establish a live backend connection.

## Architecture

- `src/app`: providers, router, layouts, home/error pages.
- `src/features/auth`: session, forms, schemas, trusted role guard, auth store.
- `src/features/vendors`: demo discovery, menus, vendor editor placeholder.
- `src/features/ordering`: multi-vendor cart, checkout preview, schemas.
- `src/features/dispatch-tracking`: order status subscription, location receiver, Leaflet/OpenStreetMap maps.
- `src/features/rider`: queue placeholder and opt-in GPS Broadcast sender.
- `src/features/admin`: administration placeholders.
- `src/shared`: shadcn UI, generic hooks, typed clients, constants, database contract.

Use relative imports inside a feature. Other features and app code import through each feature's `index.ts`; ESLint rejects deep feature alias imports. Route loader exports keep page modules lazy. Zustand stores are independent and require no provider. There is no unnecessary query client.

Tailwind v4 runs through `@tailwindcss/vite`; design tokens live in `src/index.css` with `@theme`. There is no Tailwind config file. The `@` alias is in Vite and both TypeScript configs. shadcn aliases target `shared/components/ui` and `shared/lib/utils.ts`.

## Routes

| Route                  | Behavior                                                        |
| ---------------------- | --------------------------------------------------------------- |
| /                      | Home                                                            |
| /login, /register      | Supabase email/password authentication                          |
| /vendors, /vendors/:id | Demo restaurant list and menu                                   |
| /cart                  | Items grouped by vendor; integer kobo totals                    |
| /checkout              | Server-priced checkout and Paystack online payment             |
| /orders/:id/track      | Signed-in tracking; requires an accessible real order UUID      |
| /vendor/dashboard      | Approved vendor role                                            |
| /rider/dashboard       | Approved rider role, queue and location sharing                 |

Anonymous tracking/dashboard visitors are redirected to login and returned afterward. Public discovery/cart/checkout previews remain accessible. Unknown URLs show an error page.

## Authentication and authorization

`LoginForm.tsx` is the end-to-end RHF + Zod example: validate, call Supabase, display failure, update session, navigate. `useSession` listens for auth changes and cleans up its subscription; it avoids applying a stale initial session response.

Roles come only from server-managed `user.app_metadata.role`: customer, vendor, rider, admin. Registration does not let users grant themselves roles. Provision customer roles through a trusted backend onboarding flow and approve vendor/rider roles separately. Unknown/missing roles cannot enter protected role layouts.

Route guards are UI controls, not database security. Database RLS must scope orders to the customer, participating vendors, assigned rider, and approved administration. Never rely on a client-supplied role or price.

## Supabase project setup

The repository includes ordered migrations for the application schema, RLS, storage, payments, and Realtime authorization. A live Supabase project still needs those migrations and Edge Functions deployed. `database.types.ts` is a provisional contract; regenerate it after applying the migrations:

```sh
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/shared/types/database.types.ts
```

Generate via Supabase CLI using your own authenticated project, then align the consumers with the actual schema. Do not run this against an empty schema expecting the scaffold contract to remain.

For live order status, apply the migrations through `0019_realtime_authorization.sql`, then test with an authorized signed-in account and accessible order UUID. The migrations add `orders` to the `supabase_realtime` publication and define the database policies and triggers. Confirm the hosted project's schema matches before testing.

`useOrderStatusChannel` subscribes to filtered Postgres UPDATE events, fetches the initial order after subscribing, refreshes on reconnection, validates rows, ignores older updates, and removes the channel on unmount/order change. Statuses: pending → accepted → preparing → picked_up → delivered, plus cancelled.

For rider GPS:

- Rider sender, customer tracker, and admin dispatch map's location listener use the private topic `order-tracking-<orderId>`, event `position`.
- Payload: riderId, lat, lng, accuracy (metres), timestamp (epoch milliseconds).
- All location channel clients call Realtime `setAuth()` before subscribing.
- The admin dispatch order-change feed uses its own private `admin:dispatch-orders` topic and requires an admin session.
- Migration `0019_realtime_authorization.sql` authorizes the assigned rider and admins to send, and the order's customer, assigned rider, and admins to receive while the delivery is active. Vendors and unrelated users are excluded. Enable private-only channels in Realtime settings.
- The browser sender is opt-in, throttled to one tick per 3 seconds, and stops its geolocation watcher/channel on unmount or opt-out.
- The receiver validates coordinates/identity and ignores older or far-future ticks. Broadcast is transient: the UI shows the last update time and waits for the next tick after reconnecting. It does not promise background tracking on a locked phone.
- Realtime errors are surfaced. Policies/roles must be tested with separate customer, vendor and rider accounts before deployment.

There is no custom socket server or Socket.IO dependency.

## Copyable patterns

- Form: `features/auth/components/LoginForm.tsx`.
- Typed store/actions: `features/ordering/store/cartStore.ts`. Composite vendor/item identity prevents cross-vendor collisions; quantities are 0–99, and zero removes an item.
- Realtime: `features/dispatch-tracking/hooks/useOrderStatusChannel.ts` and `useLiveOrderPosition.ts`.
- GPS sender: `features/rider/hooks/useActiveDeliveryLocation.ts`.
- Supabase singleton: `shared/lib/supabaseClient.ts`, nullable only for unconfigured preview mode.
- Axios singleton: `shared/lib/axiosClient.ts`, token attached only to the explicitly configured trusted API origin; errors retain Axios details. Supabase calls use the Supabase SDK directly.

## Scope and next three features

1. Verify migrations, Edge Functions, and RLS against the hosted Supabase project.
2. Complete end-to-end tests for paid checkout, refunds, vendor/rider workflows, and multi-user dispatch.
3. Replace remaining demo/placeholder areas and prepare production hosting with browser-route rewrites.

## Version decisions and references

npm registry versions were checked during setup. The latest registry majors exceeded the brief for TypeScript and React Router; those remain at the latest compatible 5.x and 7.x releases as explicitly requested. Vite's current template used Oxlint; it was replaced with the required ESLint flat configuration.

- [shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite)
- [Supabase publishable keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/)
