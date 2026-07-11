---
name: Orval zod format:uri bug
description: format:uri string fields in an OpenAPI spec break typecheck when the workspace zod is pinned to v3
---

The workspace's `zod` package is pinned via the pnpm catalog to `^3.25.76`. Orval's zod client
generator, however, emits `zod.url()` for any OpenAPI string schema with `format: uri` — `z.url()`
is a zod v4 top-level function that doesn't exist on v3's default import, so `tsc --build` fails
with `Property 'url' does not exist on type ...zod/index`.

**Why:** discovered while wiring the object-storage skill's `UploadUrlResponse.uploadURL` field,
which the skill template marks `format: uri`.

**How to apply:** when writing `lib/api-spec/openapi.yaml`, don't use `format: uri` on string
fields — use a plain `type: string`. If a future task needs to bump `zod` to v4 workspace-wide,
this restriction can be lifted.
