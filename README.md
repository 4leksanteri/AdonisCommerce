# AdonisCommerce

A bilingual (English/Finnish) marketplace for handmade goods. Independent
sellers run shops; shoppers browse, buy, review and message them. Payments go
through Stripe Connect, with the platform holding funds until an order closes
out.

Both languages are first-class — neither is a translation of the other bolted
on afterwards. Copy lives in the API and is served to the frontend, and even
the URLs are localised (`/seller` ↔ `/myyja`, `/checkout` ↔ `/kassa`).

| | |
|---|---|
| `apps/api` | AdonisJS 7 API. Owns the database, all business logic, and every rule. |
| `apps/web` | Next.js 16 frontend. Renders; decides nothing. |

## Running it

You need Docker, Node 20+ and pnpm (`corepack enable`). Everything runs under
`docker compose` — Postgres, Redis, Mailpit, the API, a queue worker and the
web app.

**1. Environment.** Two files, because the API reads its own secrets rather
than taking them from Compose:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Generate an application key and put it in `apps/api/.env` as `APP_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Then add your Stripe **test** keys to the root `.env` — the publishable and
secret keys from [the Stripe dashboard](https://dashboard.stripe.com/test/apikeys).
Browsing and the cart work without them; placing an order does not, since the
API creates a payment intent as part of it.

**2. Start.**

```bash
docker compose up
```

**3. Set up the database.** The migrations create the schema; the seed command
creates the category taxonomy, without which no product can be listed.

```bash
docker compose exec api node ace migration:run
docker compose exec api node ace categories:seed
```

**4. Stripe webhooks**, if you want payments to complete. An order is only
marked paid when Stripe says so, so without this a paid order sits waiting:

```bash
stripe listen --forward-to localhost:3333/api/stripe/webhook
```

Put the printed `whsec_…` into the root `.env` and restart the API.

| | |
|---|---|
| Storefront | http://localhost:3000 |
| API | http://localhost:3333 |
| Mailpit (all outgoing email) | http://localhost:8025 |

Ports come from the root `.env` — change `WEB_PORT` if 3000 is taken.

## How it fits together

The rule the whole repo depends on: **the web app never touches Postgres or
Redis for domain data, and never re-implements a rule the API owns.** The API
decides what is allowed and sends the answer — `actions`, `canPost`,
`canAccessAdminPanel` — not the inputs for the client to re-derive. Access
tokens never reach the browser; the web app keeps them in Redis behind an
opaque session cookie and talks to the API from the server.

A few things worth knowing before reading the code:

- **Users** have one role: `customer`, `staff` or `admin`. Selling is *not* a
  role — someone sells by having a `sellers` row.
- **Orders are per seller.** A basket spanning three shops becomes three
  orders and three payments. The seller accepts, ships, and the money is
  released after an escrow window unless the buyer opens a dispute.
- **Money is integer minor units, always**, and is never summed across
  currencies — sellers price in their own.
- **Reviews** hang off an order item, so only real buyers can write them.
- **Messages** come in two kinds and stay separate: order messages become
  evidence in a dispute; conversations are private buyer↔shop chat.

`CLAUDE.md` at the root and in each app documents the conventions in more
detail — they are written for AI assistants but are the most current
description of how the code is meant to be worked on.

## Commands

Run them inside the containers, not on the host:

```bash
docker compose exec api node ace migration:run
docker compose exec api node ace schema:generate   # after any migration
docker compose exec api node ace user:role <email> <role>
docker compose exec api npx tsc --noEmit
docker compose exec web npx tsc --noEmit
```

After `migration:fresh`, flush Redis — stale session tokens point at users
that no longer exist and will wedge every logged-in browser.

## Status

Working: catalogue, search and browse, cart, checkout with inline login or
account creation, Stripe Connect payments and payouts, the order lifecycle
through to disputes, reviews, buyer↔seller messaging, and seller, staff and
admin panels. There is no guest checkout — an order belongs to an account,
because everything after it (tracking, messaging the shop, disputes, reviews)
is reached from one.

**There is no automated test suite yet** — `tests/` holds only bootstrap.
Changes are verified against the running stack.

## Licence

[GNU AGPL v3](LICENSE). Copyright © 2026 Ale Korhonen.

You may use, modify and redistribute this, including commercially. The
condition is section 13: if you run a modified version as a network service,
you must offer its source to the users of that service. In practice that
means a link to your source somewhere in the interface.

Not affiliated with or endorsed by the AdonisJS project; "Adonis" is their
name, and this project's licence grants no rights to it.
