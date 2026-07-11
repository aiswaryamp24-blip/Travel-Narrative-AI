# Trip Correspondent

An agentic AI travel magazine: upload a folder of trip photos and an AI correspondent clusters them into days, researches each location's weather/landmarks, and files a magazine-style day-by-day narrative.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (backend, mounted at `/api`)
- `pnpm --filter @workspace/trip-correspondent run dev` — run the frontend (React + Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (Replit AI Integrations — no personal API key needed), `DEFAULT_OBJECT_STORAGE_BUCKET_ID` / `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS` (Replit Object Storage)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter router, react-query, Tailwind, shadcn/ui, react-markdown ("Paper & Ink" editorial theme — Playfair Display + DM Sans)
- API: Express 5, mounted at `/api` in the `api-server` artifact
- DB: PostgreSQL + Drizzle ORM
- AI: Claude (Anthropic) via Replit AI Integrations, called with tool-calling for agentic research
- Object storage: Replit App Storage (GCS-backed) for uploaded trip photos
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (Trip/TripDay/Photo schemas, Storage endpoints)
- `lib/db/src/schema/trips.ts` — `trips`, `photos`, `trip_days` Drizzle tables
- `artifacts/api-server/src/lib/geo.ts` — haversine distance + day-clustering of photos by date/GPS
- `artifacts/api-server/src/lib/research.ts` — direct clients for Nominatim (reverse geocode), Open-Meteo (historical weather + elevation), Overpass (landmarks)
- `artifacts/api-server/src/lib/narrative.ts` — Claude tool-calling loop that researches and writes one day's story
- `artifacts/api-server/src/lib/tripProcessor.ts` — top-level pipeline: cluster → research each day → persist → mark trip ready/error
- `artifacts/api-server/src/routes/trips.ts` — trip CRUD, photo attach, process trigger
- `artifacts/api-server/src/routes/storage.ts` — presigned upload URL + object serving
- `artifacts/trip-correspondent/src/pages/` — home (upload/dispatch) and trip (magazine spread) pages

## Architecture decisions

- No user accounts: this is a single-owner tool, so the object storage upload endpoint (`POST /storage/uploads/request-url`) is intentionally left unauthenticated rather than gated behind Replit Auth (a deliberate deviation from the object-storage skill's default template).
- Trip processing runs as an in-memory fire-and-forget async job kicked off by `POST /trips/:id/process` (no queue system); the frontend polls `GET /trips/:id` for status transitions (`pending` → `processing` → `ready`/`error`).
- EXIF (GPS + capture timestamp) is extracted client-side via `exifr` before upload, not server-side — keeps the upload flow simple and avoids parsing image bytes on the backend.
- Claude researches each day agentically via real tool calls (`reverse_geocode`, `get_historical_weather`, `get_landmarks`, `submit_final_story`) against Nominatim/Open-Meteo/Overpass — the DB row is populated from whatever those tool calls actually returned, so the stored facts always match what the narrative is grounded in.
- Nominatim/Open-Meteo/Overpass are free, keyless public APIs called directly via server-side `fetch` — no connector/integration needed.

## Product

- Home page: masthead + upload form (title + folder of photos) that creates a trip, uploads photos, and dispatches the AI pipeline; below it, a gallery of past trip "issues" with cover art and status.
- Trip page: full magazine spread — cover, then a day-by-day narrative sequence with weather, distance traveled, nearby landmarks, and that day's photos. Shows a "filing the story" state while processing and an error state with retry if the pipeline fails.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- In `lib/api-spec/openapi.yaml`, avoid `format: uri` on string schema fields — the installed `zod` is pinned to v3 (`^3.25.76`) but Orval emits `zod.url()` (a v4-only top-level function) for that format, which fails typecheck. Use a plain `type: string` instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
