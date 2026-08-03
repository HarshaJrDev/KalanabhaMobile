# Kalanabha Backend

API for the Kalanabha logistics platform — Customer App, Driver App, Admin Panel,
Dispatcher Portal, and Warehouse Operations. NestJS + TypeScript + PostgreSQL
(Prisma) + Redis/BullMQ + Socket.IO.

This directory currently contains **structure only** — folders, module
skeletons, DTO/entity shapes, and config. No business logic has been
implemented yet; see `docs/architecture/` for the full design rationale.

## Quick orientation

- `src/modules/*` — one folder per business capability (auth, shipments, drivers, …). See "Module anatomy" below.
- `src/shared/*` — cross-cutting reusable code with no business logic of its own.
- `src/core/security/*` — JWT, guards, rate limiting, CORS, helmet.
- `src/infrastructure/*` — adapters for Redis, BullMQ, Socket.IO, S3, maps, payment gateway, email/SMS/push.
- `src/jobs/*` — background workers, cron jobs, retry/DLQ handling.
- `src/monitoring/*` — health checks, metrics, tracing, audit logging.
- `prisma/schema.prisma` — DB schema, field-for-field aligned with the mobile app's `shipment/types.ts`.
- `docs/architecture/` — the full write-up: conventions, scaling plan, microservices migration path.

Run `npm install && npm run start:dev` once logic is filled in (Docker Compose in `docker/` brings up Postgres + Redis).
