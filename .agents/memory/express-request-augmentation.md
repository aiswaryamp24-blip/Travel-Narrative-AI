---
name: Express Request augmentation with restricted types
description: How to add custom properties (e.g. req.userId) to Express's Request type when tsconfig restricts ambient @types inclusion.
---

When a package's `tsconfig.json` sets `"types": [...]` to an explicit list (e.g. `["node"]`), TypeScript stops auto-including other `@types/*` packages. In that setup, `declare module "express-serve-static-core" { interface Request { ... } }` fails with "Invalid module name in augmentation, module ... cannot be found" even though the package is installed — the restricted `types` array blocks TS from resolving it by name.

**Fix:** augment via the global `Express` namespace instead, which doesn't require resolving that module:

```ts
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
```

**Why:** this is the interface Express's own type declarations merge into, and it works regardless of the `types` array restriction.

**How to apply:** any time you need custom fields on `req` (auth middleware, request context, etc.) in a package with a restrictive `types` array.
