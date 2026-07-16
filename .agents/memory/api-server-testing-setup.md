---
name: api-server integration test setup
description: How automated tests run against the API server (Clerk mocking, real DB/object storage) — read before adding more route tests.
---

The monorepo had no test runner configured anywhere before digest-delete tests were added. `artifacts/api-server` now has vitest + supertest (`pnpm --filter @workspace/api-server run test`), with `src/test/setup.ts` mocking `@clerk/express` (and `@clerk/shared/keys`) so `getAuth` reads a test-only `x-test-user-id` header instead of needing a real Clerk session.

Tests run against the real dev Postgres (`DATABASE_URL`) and real object storage (env vars already provisioned) rather than mocks — insert/clean up rows and objects directly via `@workspace/db` and `ObjectStorageService` in test setup/teardown.

**Why:** the app wires Clerk middleware unconditionally in `app.ts`; mocking the module is far simpler than standing up a fake Clerk session, and the real DB/object storage were already live in this environment so integration-style tests give higher-fidelity coverage than mocking them too.

**How to apply:** when adding tests for other API server routes, reuse `src/test/setup.ts`'s Clerk mock and follow the same pattern (pre-insert any users the route's `requireAuth` needs, since `ensureLocalUser` short-circuits once a row exists).
