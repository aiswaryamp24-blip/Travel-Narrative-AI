---
name: Express 5 req.params typed as string | string[]
description: Why passing req.params.<name> straight into a typed function (e.g. drizzle's eq()) fails to typecheck in this project's Express 5 setup, and the fix.
---

In this project's `@types/express-serve-static-core@5.1.1`, `ParamsDictionary` is
`{ [key: string]: string | string[] }` — every param key is typed as
`string | string[]`, not just wildcard/`*` params. This only bites when a
route handler is explicitly annotated `(req: Request, res: Response)` (the
common pattern in `artifacts/api-server/src/routes/*.ts`), since that pins
the generic `P` to the default `ParamsDictionary` instead of the
route-string-inferred literal param type.

**Why it matters:** code like `db.select().where(eq(someColumn, req.params.userId))`
or `someFn(req.params.userId)` (expects `string`) fails to typecheck with a
confusing drizzle/overload error that doesn't obviously point at
`req.params`.

**How to apply:** coerce the param to a string at the top of the handler —
`const userId = String(req.params.userId);` — before using it anywhere a
plain `string` is required. (Existing code in `trips.ts` avoids the issue
only because it happens to pass params through `Number(...)`, which accepts
`any`.)
