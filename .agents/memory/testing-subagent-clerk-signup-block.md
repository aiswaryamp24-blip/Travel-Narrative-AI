---
name: Testing subagent blocked by Clerk bot-check on sign-up
description: The Playwright testing subagent cannot complete Clerk sign-up flows because Cloudflare's human-verification challenge blocks headless/automated browsers.
---

When a testing subagent (`config: { $kind: "testing" }`) tries to walk through a fresh Clerk sign-up (`/sign-up`), Clerk's Cloudflare-backed bot protection often intercepts it with a "Verify you are human" challenge that cannot be solved programmatically. The tester correctly reports `verdict: "unable"` rather than a false failure.

**Why:** this is a third-party anti-bot gate on Clerk's hosted verification flow, not an application bug — it is not something app code changes can bypass.

**How to apply:** when a task depends on Clerk auth (new sign-ups, gated flows), don't rely on the testing subagent to complete the sign-up step itself. Instead:
- Visually verify sign-in/sign-up page rendering via `Screenshot` (appPreview).
- Verify auth-gated backend behavior directly with `curl` (e.g. expect 401 on protected routes without a session, 404 on not-found/forbidden resources).
- Reserve the testing subagent for flows that don't require passing through Clerk's own sign-up challenge (e.g. already-authenticated flows, if a session can be seeded another way).
