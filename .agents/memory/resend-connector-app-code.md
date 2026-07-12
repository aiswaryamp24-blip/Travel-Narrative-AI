---
name: Resend connector usage from app code
description: How to send transactional email via the Resend connector from server code (not the CodeExecution sandbox).
---

Use `@replit/connectors-sdk`'s `ReplitConnectors` class directly in app/server code (add it as a real dependency of that package, not just referenced from the sandbox). Call `connectors.proxy('resend', '/emails', { method: 'POST', body: {...} })` — this mirrors Resend's own REST API shape (`from`, `to`, `subject`, `html`, `text`), and `proxy()` returns a standard `Response`.

`listConnections(...)` and other sandbox globals from the `integrations`/`delegation` skills are for the CodeExecution notebook only (`"use impure"` blocks) — they resolve nothing in actual app code and aren't how the running server should reach a connector.

**Why:** the addIntegration-provided snippet for Resend is a generic proxy example, not Resend-specific; you have to know the target REST path (`/emails`) yourself.

**How to apply:** when wiring a connector into a real service (email, etc.), install `@replit/connectors-sdk` in that workspace package's `package.json`, instantiate `new ReplitConnectors()` once, and call `.proxy(connectorName, path, options)` per request — don't cache a client with baked-in credentials.
