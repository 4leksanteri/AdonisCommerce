# AdonisJS API

The backend for the marketplace. AdonisJS 7 + Lucid 22 + VineJS, Postgres,
Redis, BullMQ.

## This is NOT the AdonisJS you know

v7 differs from v5/v6 in ways your training data will get wrong. Before
writing anything unfamiliar, read the real thing: `node_modules/@adonisjs/*`
and the existing code in this app. Specifically:

- Validators are `vine.create({...})`, not `vine.compile(vine.object({...}))`.
  Metadata is `vine.withMetaData<T>().create({...})`.
- Controllers are referenced through `#generated/controllers`, not string
  paths. That file is generated — restart the dev server to pick up a new
  controller.
- `database/schema.ts` is **generated** by `node ace schema:generate`. Models
  extend the generated `XSchema` classes and add only relations and derived
  getters. Never hand-edit it; it is also permanently unformatted, so exclude
  it when running prettier.

## Layout

Laravel's shape, which Adonis follows. Keep to it.

| Directory | Holds |
|---|---|
| `app/controllers` | HTTP entry points. Thin. |
| `app/services` | Business logic and anything more than one controller needs. |
| `app/models` | Lucid models: relations, derived getters, domain predicates. |
| `app/transformers` | Everything that shapes an API response. |
| `app/validators` | VineJS schemas. All external input goes through one. |
| `app/middleware` | Guards. Registered in `start/kernel.ts`. |
| `app/mails` | One generic `TransactionalNotification`; copy lives in lang files. |
| `database/migrations` | Schema. One concern per migration. |
| `start/routes.ts` | Every route, grouped by audience. |
| `commands/` | Ace commands for operational work. |

Import through the `#` aliases (`#services/payments`, `#models/order`), never
relative paths across directories.

## Controllers stay thin

A controller validates, calls a service or a model, and serializes. If a
handler is making decisions about money, state transitions or who is allowed
to do what, that logic belongs in `app/services` where the other caller can
reach it too.

The authorization surface for a feature lives in **one function**
(`participationFor`, `directParticipationFor`). Two callers asking the same
question separately is how one of them ends up more permissive.

## Transformers

The serializer only resolves transformers that are **direct values** of what
you hand `serialize()`. A transformer nested inside a plain object, or an
array you built with `.map(X.transform)`, comes out as raw model dumps.

```ts
// Wrong — comes out as raw models
serialize({ rows: items.map((i) => ItemTransformer.transform(i, role)) })
// Right
serialize({ rows: ItemTransformer.transform(items, role) })
```

`.depth(n)` goes on the **nested** transform, not the outer one.

## Conventions that are load-bearing

- **Money is integer minor units.** Never sum across currencies — aggregate
  grouped by currency and return a row each. Converting for display or
  sorting goes through the ECB rates in `#services/exchange_rates`.
- **Snapshot anything a buyer was shown**: item titles, prices, shop name.
  Orders and reviews must survive the catalogue moving on.
- **The server owns state machines.** Send clients answers (`actions`,
  `canPost`, `canAccess*`), not the inputs to re-derive them.
- **Guards answer 404, not 403.** An admin surface should not confirm its own
  existence to someone probing it.
- **Deleting an account means anonymising it.** See the docblock on
  `#models/user`; foreign keys are set up to enforce it.
- Queues are an optimisation; the database is the authority. A mail or job
  failure must never take down the thing that triggered it.

## Routes

Grouped by who is asking, and the prefix says which:

| Prefix | Audience |
|---|---|
| `/api/storefront/*` | Unauthenticated shoppers. Every handler filters to what is public. |
| bare (`/api/orders`, `/api/products`) | The seller's own view of a resource. |
| `/api/account/*` | The signed-in person's own account. |
| `/api/conversations/*`, `/api/order-messages/*` | Shared by several roles; one endpoint, one authorization check. |
| `/api/staff/*`, `/api/admin/*` | Behind `middleware.staff()` / `middleware.admin()`. |

Verbs over PATCHing a status field when the outcomes are different decisions
(`/accept`, `/ship`, `/cancel`), because they are not interchangeable values.

Put static segments **above** dynamic ones — routes match in declaration
order. Add a `.where('id', router.matchers.uuid())` so a junk id 404s at the
router instead of reaching Postgres.

## Database

- Every schema change is a migration. Never edit one that has been applied —
  write another.
- Comment the *why* in the migration. It is the only place the reasoning for
  a column survives.
- Denormalise deliberately and say so (`orders.shop_name`,
  `conversations.last_message_at`).
- Use `FOR UPDATE`, partial unique indexes and `UPDATE … RETURNING` as
  concurrency guards rather than read-then-write.
- After `migration:fresh`, flush Redis — stale `websession:*` tokens point at
  users that no longer exist and wedge every logged-in browser.

## Translations

`resources/lang/{en,fi}.json` are the single source of copy for both apps —
the web app fetches them from `/api/translations/:locale`.

- **The API caches them in memory. Restart it after editing.**
- The two files must stay key-identical. Check before finishing.
- Error codes go under `ApiMessages`, keyed by the `code` the API returns.
- Finnish inflects place names; never interpolate one into a sentence. Use a
  standalone label and a separate value.

## Commands

Run inside the container: `docker compose exec api <cmd>`.

```
node ace serve --hmr        # dev (the compose service already does this)
node ace migration:run
node ace schema:generate    # after any migration
node ace queue:work         # the worker service
node ace test
npx tsc --noEmit
npx eslint app start        # prettier config ships with Adonis; bare
npx prettier --write <path> # `prettier --write` is correct here
```

There is no test suite yet — `tests/` holds only bootstrap. Verify changes by
exercising the real endpoints against the running stack.
