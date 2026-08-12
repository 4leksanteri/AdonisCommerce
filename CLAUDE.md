# Marketplace

A bilingual (English/Finnish) marketplace for handmade goods. Independent
sellers run shops; shoppers browse, buy, review and message them. Payments go
through Stripe Connect, with the platform holding funds until an order
closes out.

## Applications

| Path | What it is |
|---|---|
| `apps/api` | AdonisJS 7 API. Owns the database, all business logic, and every rule. |
| `apps/web` | Next.js 16 frontend. Renders; decides nothing. |

Each has its own `CLAUDE.md` with the rules for working inside it. Read the
one for the app you are editing.

Services run under `docker compose`: `postgres`, `redis`, `mailpit`, `api`,
`worker`, `web`. Run commands inside them
(`docker compose exec api node ace migration:run`), not on the host.

## The boundary

This is the rule the whole repo depends on.

- The web app **never** touches Postgres or Redis directly for domain data,
  and never re-implements a rule the API owns.
- The API decides what is allowed and sends the **answer** — `actions`,
  `canPost`, `canAccessAdminPanel` — not the inputs for the client to
  re-derive. A rule copied into the frontend is the copy that goes stale.
- Access tokens never reach the browser. The web app keeps them in Redis
  keyed by an opaque session cookie and talks to the API from the server.
- Secrets belong to the API only. The Stripe secret key and webhook secret
  are API-side; only the publishable key is web-side. **Never** put a secret
  behind `NEXT_PUBLIC_` — Next inlines those into the browser bundle.

## Domain

- **Users** have one role: `customer`, `staff` or `admin`. Selling is *not* a
  role — someone sells by having a `sellers` row.
- **Sellers** own products, shipping profiles and orders. A shop is approved
  before it is public and connected to Stripe before it is paid.
- **Orders** are per seller — a basket spanning three shops becomes three
  orders and three payments. The seller accepts, ships, and the money is
  released after the escrow window unless the buyer opens a dispute.
- **Disputes** are settled by the seller refunding or by staff, who can read
  the order's conversation for exactly as long as there is a case on it.
- **Reviews** are tied to an order item, so only real buyers write them.
- **Messages** come in two kinds and stay separate: `order_messages` hang off
  a transaction and become evidence in a dispute; `conversations` are private
  buyer↔shop chat that nobody else can read.

## Money

Integer minor units, everywhere, always. Sellers price in their own currency,
so **never sum across currencies** — aggregate grouped by currency. Display
conversion uses ECB rates and falls back to the original currency when a rate
is missing. Anything a buyer was shown is snapshotted onto the order.

## Two languages, everywhere

Both are first-class; neither is a translation of the other bolted on later.

- Copy lives in `apps/api/resources/lang/{en,fi}.json`, served to the web app.
  Both files must stay key-identical.
- URLs are localized (`/seller` ↔ `/myyja`, `/account` ↔ `/tili`) in
  `apps/web/i18n/routing.ts`. Any path the API puts in an email must match —
  see `apps/api/app/services/frontend_routes.ts`. There is no automated check.
- Category slugs are translated per locale; everything else in a path is not.

## Working here

- `pnpm` workspaces. Install at the root.
- Generated files are not hand-edited: `apps/api/database/schema.ts`,
  `apps/api/.adonisjs/`, `apps/web/AGENTS.md`.
- Prefer extending an existing abstraction to adding a parallel one. If two
  places need the same decision, it belongs in one function in the API.
- Changing an API response shape means checking both ends before finishing.
- No test suite yet. Verify against the running stack — exercise the real
  endpoint, then render the real page in both languages.
- Typecheck and lint both apps before calling something done.

## Formatting

`apps/api` ships Adonis's prettier config, so `npx prettier --write` is
correct there — but skip `database/schema.ts`.

`apps/web` has **no** prettier config while being written to
`--print-width 100 --trailing-comma es5`. A bare `prettier --write` there
reformats the entire codebase at 80 columns. Always pass those two flags, and
never glob over files you did not change.
