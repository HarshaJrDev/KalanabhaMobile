# Kalanabha Mobile — Architecture

## `src/` structure (current)

```
src/
  api/            # HTTP client, socket client, network/offline detection, query client, shared API types
  config/         # env config, third-party SDK config (firebase, etc.)
  types/          # cross-feature shared types
  validation/     # zod schemas
  services/       # thin wrappers around device/platform SDKs (storage, firebase, location)
  location/       # location-tracking hooks (driver ping, live tracking)
  data/           # mock/fixture data (dev-only; not imported by any production code path)
  shipment/       # @deprecated backward-compat shim over features/shipments — no active consumers,
                  # kept only so any external caller of the old shape doesn't break

  features/       # one folder per business capability: auth, users, shipments, tracking,
                  # chat, notifications, dashboard, settings, store (Zustand)
                  # each feature: types.ts, api/*.api.ts, hooks.ts, mapper.ts (if needed)

  screens/        # route-level screens — presentation only, delegate to features/*/hooks
  components/     # shared, feature-agnostic UI components
  hooks/          # cross-cutting hooks not owned by one feature (useAuthState, useLogin, ...)
  ui/             # design-system-ish shared UI (alert/toast)
  utils/          # generic, dependency-free helpers
```

`App.tsx` and `index.js` stay at the repo root (React Native convention — Metro's entry point).
Everything else application-owned lives under `src/`.

**Rule of dependency direction:** `screens` → `hooks`/`features/*/hooks` → `features/*/api` → `src/api` → backend.
Screens must not import `features/*/api` directly, and `features/*` must not import from `screens`.

## Import aliases

Configured in `babel.config.js` (`module-resolver`) and mirrored in `tsconfig.json` (`paths`):
`@app`, `@api`, `@config`, `@types`, `@validation`, `@services`, `@location`, `@data`, `@shipment`,
`@features`, `@screens`, `@navigation`, `@components`, `@hooks`, `@utils`, `@ui`.

Every one of these now points at the folder's real, final location under `src/`. New code should
always import via alias, never via a relative path that crosses a module boundary (e.g. a screen
reaching into `features/*/api` or `components/` two directories up) — relative imports are fine
*within* a single feature/component/screen's own subtree.

## Migration history

All phases below are complete, each verified independently with `tsc --noEmit` (diffed against the
pre-migration error baseline — 47 pre-existing, unrelated errors throughout, zero regressions) and
a full Metro production-mode bundle build (`metro build`, cache reset, 3486 modules, exit 0):

1. Aliases introduced, pointing at then-current locations.
2. `Config/`, `type/`, `validation/`, `Data/` → `src/config`, `src/types`, `src/validation`, `src/data`.
3. `utils/`, `ui/` → `src/utils`, `src/ui`.
4. `hooks/` → `src/hooks`.
5. `components/` → `src/components`.
6. `features/` → `src/features`.
7. `Screens/` → `src/screens`.
8. `shipment/` (legacy shim) → `src/shipment`.

Each phase: move the folder (`git mv`, preserving history), update its alias target in
`babel.config.js` + `tsconfig.json`, fix the moved files' own outbound relative imports (crossing
back out of the moved subtree) to use aliases, fix every external consumer's inbound relative
import to the new alias, then verify with `tsc` + a fresh-cache Metro bundle before moving on.
