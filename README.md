# Chopza — Kano food ordering & live dispatch

SWE4600 frontend scaffold. React 19, TypeScript 5 (strict), Vite 8, Tailwind CSS 4, shadcn/ui, React Router 7, Axios, React Hook Form + Zod, Zustand, Supabase JS 2, and Leaflet/OpenStreetMap.

## Run locally

Use Node 22.12+ (Node 24 LTS recommended). The lockfile pins the resolved dependency tree.

```sh
npm install
cp .env.example .env.local
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local`. If script execution policy blocks npm.ps1, use `npm.cmd` instead of `npm`.

Open the URL printed by Vite. The app boots without keys: restaurants are clearly labelled demo fixtures, cart actions work in memory, and backend-dependent actions display setup messages. Cart data resets on reload. No real orders, payments, tables, or migrations are created.

## Environment

| Variable                      | Purpose                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| VITE_SUPABASE_URL             | Project API URL from Supabase dashboard                                       |
| VITE_SUPABASE_PUBLISHABLE_KEY | Browser publishable key beginning sb_publishable_                             |
| VITE_API_BASE_URL             | Optional trusted non-Supabase HTTP API base URL                               |

Every VITE_ value is public in the browser bundle. Never add a Supabase secret or service-role key. Real env files are gitignored. Restart Vite after changing env.

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
| /checkout              | Delivery form validation; order creation explicitly unavailable |
| /orders/:id/track      | Signed-in tracking; requires an accessible real order UUID      |
| /vendor/dashboard      | Approved vendor role                                            |
| /rider/dashboard       | Approved rider role, queue and location sharing                 |

Anonymous tracking/dashboard visitors are redirected to login and returned afterward. Public discovery/cart/checkout previews remain accessible. Unknown URLs show an error page.

## Authentication and authorization

`LoginForm.tsx` is the end-to-end RHF + Zod example: validate, call Supabase, display failure, update session, navigate. `useSession` listens for auth changes and cleans up its subscription; it avoids applying a stale initial session response.

Roles come only from server-managed `user.app_metadata.role`: customer, vendor, rider, admin. Registration does not let users grant themselves roles. Provision customer roles through a trusted backend onboarding flow and approve vendor/rider roles separately. Unknown/missing roles cannot enter protected role layouts.

Route guards are UI controls, not database security. Before connecting real data, implement RLS that scopes orders to the customer, participating vendors, assigned rider and approved administration. Never rely on a client-supplied role or price.

## Supabase and realtime setup still required

No Supabase project credentials or schema were provided. `database.types.ts` is explicitly a provisional contract, not fabricated generated output. The proposed orders row contains id, customer_id, rider_id, status, updated_at. Replace it after creating the real schema:

```sh
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/shared/types/database.types.ts
```

Generate via Supabase CLI using your own authenticated project, then align the consumers with the actual schema. Do not run this against an empty schema expecting the scaffold contract to remain.

For live order status:

1. Create the orders schema and appropriate RLS policies in the backend phase.
2. Add orders to the supabase_realtime publication.
3. Ensure updated_at advances for every status change.
4. Test with an authorized signed-in account and accessible order UUID.

`useOrderStatusChannel` subscribes to filtered Postgres UPDATE events, fetches the initial order after subscribing, refreshes on reconnection, validates rows, ignores older updates, and removes the channel on unmount/order change. Statuses: pending → accepted → preparing → picked_up → delivered, plus cancelled.

For rider GPS:

- Sender and receiver use the private topic `rider:<riderId>:location`, event `location`.
- Payload: riderId, lat, lng, accuracy (metres), timestamp (epoch milliseconds).
- Both call Realtime setAuth before subscribing.
- Add Realtime Authorization RLS policies on realtime.messages: only the matching approved rider may send; only participants in active assigned orders may receive. Enable private-only channels in Realtime settings.
- The browser sender is opt-in, throttled to one tick per 3 seconds, and stops its geolocation watcher/channel on unmount or opt-out.
- The receiver validates coordinates/identity and ignores older or far-future ticks. Broadcast is transient: the UI shows the last update time and waits for the next tick after reconnecting. It does not promise background tracking on a locked phone.
- Realtime errors are surfaced. Policies/roles must be tested with separate customer, vendor and rider accounts before deployment.

There is no custom socket server or Socket.IO dependency.

## Copyable patterns

- Form: `features/auth/components/LoginForm.tsx`.
- Typed store/actions: `features/ordering/store/cartStore.ts`. Composite vendor/item identity prevents cross-vendor collisions; quantities are 0–99, and zero removes an item.
- Realtime: `features/dispatch-tracking/hooks/useOrderStatusChannel.ts` and `useLiveRiderLocation.ts`.
- GPS sender: `features/rider/hooks/useBroadcastLocation.ts`.
- Supabase singleton: `shared/lib/supabaseClient.ts`, nullable only for unconfigured preview mode.
- Axios singleton: `shared/lib/axiosClient.ts`, token attached only to the explicitly configured trusted API origin; errors retain Axios details. Supabase calls use the Supabase SDK directly.

## Scope and next three features

1. Backend schema, RLS, account profiles and trusted customer/vendor/rider onboarding.
2. Real vendor discovery and menu management, replacing demo fixtures.
3. Atomic multi-vendor checkout and authorized dispatch assignment, then live tracking against real orders.

Payment integration and full business workflows are intentionally outside this bootstrap. Production hosting must rewrite unknown application paths to index.html for browser routing.

## Version decisions and references

npm registry versions were checked during setup. The latest registry majors exceeded the brief for TypeScript and React Router; those remain at the latest compatible 5.x and 7.x releases as explicitly requested. Vite's current template used Oxlint; it was replaced with the required ESLint flat configuration.

- [shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite)
- [Supabase publishable keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/)
