# Architecture Overview

## 1. Top-level folders

| Folder | Purpose |
|---|---|
| `src/app` | Root `AppModule` — wires every feature module together. Nothing else lives here. |
| `src/config` | Typed config loaders (env validation via `zod`), one file per concern (`database.config.ts`, `redis.config.ts`, `jwt.config.ts`, …). |
| `src/common` | Cross-module primitives with zero business meaning: base classes, generic pipes. |
| `src/core` | Framework-level concerns that every module depends on: security (JWT, guards, rate limiting), bootstrap wiring. |
| `src/database` | Prisma client provider, transaction helpers, DB-level config — not the schema itself (that's `prisma/`). |
| `src/infrastructure` | Adapters to the outside world: Redis, BullMQ, Socket.IO, email/SMS/push, file storage, maps, payment gateway. Modules depend on these through interfaces, never directly on the SDKs. |
| `src/modules` | Business capabilities. See §2. |
| `src/shared` | Reusable, business-agnostic building blocks: response builder, pagination, encryption, date/file utils. |
| `src/queues`, `src/jobs` | BullMQ queue definitions and the workers/cron/retry logic that consume them. |
| `src/events` | Domain event definitions shared across modules (in addition to each module's own `events/`). |
| `src/websocket` | Socket.IO gateway(s) for live tracking, chat, dispatch pings. |
| `src/storage`, `src/mail`, `src/cache` | Thin, injectable wrappers used by `infrastructure/*` adapters. |
| `src/health`, `src/monitoring` | Liveness/readiness probes, metrics, request tracing, audit/perf logging. |
| `src/middleware`, `src/guards`, `src/interceptors`, `src/filters`, `src/decorators` | Global (app-wide) versions of these; module-specific ones live inside the module. |
| `src/constants`, `src/enums`, `src/types`, `src/interfaces` | App-wide shared vocabulary — only put something here if 2+ modules need it. |
| `src/utils`, `src/validators` | Stateless helper functions and Zod/class-validator schemas used app-wide. |
| `prisma/` | Schema, migrations, seeders, factories — the single source of truth for persisted shape. |
| `tests/` | Cross-cutting test scaffolding (fixtures, mocks, e2e harness); module-level unit tests live next to their module. |
| `docker/`, `.github/workflows/` | Container and CI definitions. |
| `docs/` | This documentation. |

## 2. Module anatomy

Every folder under `src/modules/<name>/` follows the same shape:

```
modules/<name>/
  controllers/    HTTP entrypoints — thin, no business logic
  services/       Business logic, orchestration
  repositories/   Data access (wraps Prisma), the only layer that talks to the DB
  dto/            Request/response shapes, validated at the boundary
  entities/       Domain model, may differ from the Prisma model
  interfaces/     Contracts internal to the module
  validators/     Zod/class-validator schemas specific to this module
  guards/         Module-specific authorization rules
  events/         Domain events this module emits
  types/          Local type aliases
  constants/      Local constants/enums
  <name>.module.ts
```

`auth/` and `shipments/` are filled out as reference implementations —
copy their shape when building out the rest.

## 3. Required modules and why they exist

Derived directly from what the existing mobile app + admin dashboard already
do against Firestore, so the migration is a lift-and-shift of behavior, not a
redesign:

- **auth** — email/password (mirrors `hooks/useLogin.ts`, `useRegister.ts`), JWT + refresh tokens, replaces direct Firebase Auth calls.
- **users / roles / permissions** — unifies customer, driver, admin, dispatcher, warehouse accounts (today: `SelectAccount` screen branches client-side only).
- **customers / drivers / vehicles** — profile + fleet data (today: ad hoc fields on Firestore driver docs, see admin `Driver` interface).
- **bookings / shipments** — shipment lifecycle `searching → accepted → in_transit → delivered/cancelled` (today: `shipment/types.ts`, `shipment/actions.ts`).
- **tracking** — live location updates, powers `ShipmentDetailsScreen`.
- **dispatch** — the `acceptShipment` transaction (today: client-side Firestore transaction in `shipment/actions.ts`) moves server-side so it can't be raced or spoofed by a malicious client.
- **warehouses / inventory / branches** — not yet in the mobile app; scaffolded for warehouse ops per the stated requirement.
- **payments / invoices / pricing** — today: hardcoded/estimated in `CheckRate.tsx`; becomes a real pricing-rules engine (mirrors the admin dashboard's "Pricing rules per vehicle/service type").
- **notifications** — today: Firestore `notifications` collection read directly; becomes FCM + in-app, queued via BullMQ.
- **chat** — today: `ChatScreen.tsx` + Firestore; becomes REST history + Socket.IO live messages.
- **files** — proof-of-delivery photos, driver documents (admin dashboard shows "driver documents").
- **dashboard / reports / analytics** — admin dashboard's overview/analytics tabs.
- **settings** — admin dashboard's "logistics config" (vehicle types, weight/dimension limits).
- **audit-logs / activity-logs** — required for a multi-role system (admin edits, dispatcher overrides).
- **support / system** — customer support tickets, system-level feature flags/health.

## 4. Naming conventions

- Files: `kebab-case.type.ts` — e.g. `create-shipment.dto.ts`, `jwt-auth.guard.ts`, `shipment-status-changed.event.ts`.
- Classes: `PascalCase` suffixed by role — `ShipmentsService`, `CreateShipmentDto`, `JwtAuthGuard`.
- Folders: plural for collections of a thing (`controllers/`, `services/`), singular module name matches its Prisma model singularized where natural (`shipments` module ↔ `Shipment` model).
- DB tables/columns: Prisma model `PascalCase`, columns `camelCase` (Prisma maps to `snake_case` in Postgres via `@map` if needed later).
- REST routes: plural, kebab-case — `/api/v1/shipments`, `/api/v1/audit-logs`.
- Events: `<Entity><PastTenseVerb>Event` — `ShipmentStatusChangedEvent`.

## 5. Import conventions

- Use path aliases (`@modules/*`, `@shared/*`, `@infrastructure/*`, …) configured in `tsconfig.json` — no `../../../` chains.
- A module may import from `shared/`, `infrastructure/` (via interface), and `core/`, but **never reach into another module's internals** (`services/`, `repositories/`) — cross-module calls go through the other module's exported service, injected via its `Module.exports`.
- `infrastructure/*` adapters are injected behind an interface defined in `shared/` or the consuming module, so swapping (e.g. S3 → GCS) never touches business logic.

## 6. Best practices applied

- **Repository pattern**: controllers never see Prisma; only `repositories/` do.
- **Service layer**: all business rules live in `services/`, independently testable without HTTP.
- **DTOs at every boundary**: validated with `class-validator`/`zod` before hitting a service.
- **Domain events over direct coupling**: e.g. `shipments` emits `ShipmentStatusChangedEvent`; `notifications` listens, rather than `shipments` importing `notifications` directly.
- **Config isolation**: nothing reads `process.env` outside `src/config`.

## 7. Scalability recommendations

- Stateless API instances behind a load balancer; horizontal scale by replica count.
- Redis for session/rate-limit state so any instance can serve any request.
- BullMQ queues for anything not required synchronously (notifications, invoice generation, analytics rollups) — keeps request latency low and absorbs spikes.
- Read replicas for Postgres once reporting/analytics load grows; `repositories/` is the seam where read/write splitting gets added later without touching services.
- Socket.IO with a Redis adapter for multi-instance pub/sub (live tracking, chat) once you run more than one API pod.
- Cache hot reads (pricing rules, vehicle config) via `shared/cache-helpers`.

## 8. Future microservices migration path

The module boundaries are drawn so each `modules/<name>` can be lifted into
its own service with minimal rework:

1. **Natural first splits**: `tracking` (high write volume, different scaling profile) and `notifications`/`chat` (I/O-bound, benefits from independent scaling) are the least coupled — extract first.
2. Because cross-module calls already go through exported services (not direct repository access), replacing an in-process call with an HTTP/gRPC/event-bus call is a swap at the module boundary, not a rewrite.
3. Domain events (`src/events`, per-module `events/`) become the seam for an actual message broker (e.g. Redis Streams → Kafka/RabbitMQ) — services already communicate by emitting/consuming events, not by direct invocation, wherever that pattern was followed.
4. `dispatch` (the accept-shipment transaction) stays co-located with `shipments` even after a split, since it needs strongly consistent access to shipment state.
5. Shared Prisma schema splits per-service database once services separate; start by giving each future service its own schema namespace in the same Postgres instance, then physically separate databases only when write contention justifies it.
