# Trip Correspondent

An agentic AI travel magazine: upload a folder of trip photos and an AI correspondent clusters them into days, researches each location's weather/landmarks, and files a magazine-style day-by-day narrative. Multi-user, with Clerk accounts, per-trip privacy tiers, a social feed, and periodic "wrapped"-style PDF digests emailed to users.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (backend, mounted at `/api`)
- `pnpm --filter @workspace/trip-correspondent run dev` — run the frontend (React + Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (Replit AI Integrations — no personal API key needed), `DEFAULT_OBJECT_STORAGE_BUCKET_ID` / `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS` (Replit Object Storage), Clerk keys (auth), email provider config (digest-ready notifications), OpenAI-compatible audio credentials (day narration TTS)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter router, react-query, Tailwind, shadcn/ui, react-markdown ("Paper & Ink" editorial theme — Playfair Display + DM Sans)
- API: Express 5, mounted at `/api` in the `api-server` artifact
- DB: PostgreSQL + Drizzle ORM
- AI: Claude (Anthropic) via Replit AI Integrations, called with tool-calling for agentic research
- Object storage: Replit App Storage (GCS-backed) for uploaded trip photos, exported PDFs, and narration audio
- Auth: Clerk (`@clerk/express`), proxied through the app's own domain in production via `clerkProxyMiddleware`; local `users` rows are provisioned just-in-time from the Clerk profile on first sight
- Email: Resend, via the Replit connectors SDK (`lib/api-server/src/lib/email.ts`) — used for "your digest is ready" notifications
- Audio: OpenAI-compatible TTS (`@workspace/integrations-openai-ai-server`) for day-narration playback
- PDF: `@react-pdf/renderer` + `sharp`, for both single-trip export and periodic digests
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (Trip/TripDay/Photo schemas, Storage endpoints)
- `lib/db/src/schema/trips.ts` — `trips`, `photos`, `trip_days` Drizzle tables
- `lib/db/src/schema/users.ts` — `users`, keyed by Clerk user id
- `lib/db/src/schema/follows.ts` — one-directional follows (gates `friends`-tier trip visibility)
- `lib/db/src/schema/digests.ts` — generated "wrapped"-style recap PDFs per user per period
- `artifacts/api-server/src/lib/geo.ts` — haversine distance + day-clustering of photos by date/GPS
- `artifacts/api-server/src/lib/research.ts` — direct clients for Nominatim (reverse geocode), Open-Meteo (historical weather + elevation), Overpass (landmarks)
- `artifacts/api-server/src/lib/narrative.ts` — Claude tool-calling loop that researches and writes one day's story
- `artifacts/api-server/src/lib/tripProcessor.ts` — top-level pipeline: cluster → research each day (bounded concurrency) → persist → mark trip ready/error; clears prior `trip_days` at the start of every run so retries don't duplicate days
- `artifacts/api-server/src/lib/tripAccess.ts` — `canViewTrip` (privacy/follow rules) and `findTripForObjectPath`, which extends those same rules to raw media fetches
- `artifacts/api-server/src/lib/digestScheduler.ts` — periodic (6h-interval) check of every user's digest cadence; generates + emails a digest PDF when due
- `artifacts/api-server/src/middlewares/auth.ts` — `requireAuth` / `optionalAuth`, backed by Clerk
- `artifacts/api-server/src/routes/trips.ts` — trip CRUD, photo attach, process trigger, PDF export, day narration
- `artifacts/api-server/src/routes/storage.ts` — presigned upload URL + object serving (private objects gated by `canViewTrip`)
- `artifacts/trip-correspondent/src/pages/` — landing, home (upload/dispatch), trip (magazine spread), feed, profile pages

## Architecture decisions

- Full Clerk-backed accounts, not the single-owner/no-auth model this project started with — trips have an owner (`userId`) and a `privacy` tier (`private` / `friends` / `public`); `friends` visibility is gated by the one-directional `follows` table. `tripAccess.ts` applies the same rule to both the trip API and raw object fetches (`/storage/objects/*`), so a private trip's photos aren't fetchable just because someone has the object path.
- Trip processing runs as an in-memory fire-and-forget async job kicked off by `POST /trips/:id/process` (no queue system); the frontend polls `GET /trips/:id` for status transitions (`pending` → `processing` → `ready`/`error`). The route only transitions a trip into `processing` via a conditional update (`WHERE status != 'processing'`) so a double-click or a retry-while-still-running can't start two concurrent pipelines against the same trip. `processTrip` itself deletes any existing `trip_days` (and clears photos' `tripDayId`) before re-clustering, so retrying after a partial failure doesn't leave duplicate day rows behind.
- Day research runs with bounded concurrency (3 at a time via a small `mapWithConcurrency` helper in `tripProcessor.ts`), not full `Promise.all` — Nominatim and Overpass's free public instances prohibit bulk parallel requests, so unbounded concurrency risks getting the server IP rate-limited/banned.
- EXIF (GPS + capture timestamp) is extracted client-side via `exifr` before upload, not server-side — keeps the upload flow simple and avoids parsing image bytes on the backend.
- Claude researches each day agentically via real tool calls (`reverse_geocode`, `get_historical_weather`, `get_landmarks`, `submit_final_story`) against Nominatim/Open-Meteo/Overpass — the DB row is populated from whatever those tool calls actually returned, so the stored facts always match what the narrative is grounded in.
- Nominatim/Open-Meteo/Overpass are free, keyless public APIs called directly via server-side `fetch` — no connector/integration needed.
- Digests are always private to their owner regardless of the underlying trips' privacy tier — they're a personal keepsake, not a shareable artifact.

## Product

- Landing page for signed-out visitors; home page (signed in) is the masthead + upload form (title + folder of photos) that creates a trip, uploads photos, and dispatches the AI pipeline, plus a gallery of the user's past trip "issues" with cover art and status.
- Trip page: full magazine spread — cover, then a day-by-day narrative sequence with weather, distance traveled, nearby landmarks, and that day's photos. Shows a "filing the story" state while processing and an error state with retry if the pipeline fails. Supports PDF export and per-day audio narration.
- Feed page: public/friends-tier trips from followed users.
- Profile page: a user's own trips plus follow management; digest cadence (every 3/4/6 months) is configurable per user, and a periodic scheduler emails a "wrapped"-style recap PDF when one is due.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- In `lib/api-spec/openapi.yaml`, avoid `format: uri` on string schema fields — the installed `zod` is pinned to v3 (`^3.25.76`) but Orval emits `zod.url()` (a v4-only top-level function) for that format, which fails typecheck. Use a plain `type: string` instead.
- Don't bump `RESEARCH_CONCURRENCY` in `tripProcessor.ts` without checking Nominatim/Overpass's usage policy first — their free public instances are keyless and rate-limit/ban by IP for bulk parallel use.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
