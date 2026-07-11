---
name: Claude agentic tool-calling for research pipelines
description: Pattern for having Claude gather facts via tool calls and grounding stored data in exactly what those calls returned
---

When a backend pipeline needs Claude to research facts (geocoding, weather, external lookups) and
then write structured/narrative output grounded in those facts, prefer this pattern over calling
the fact-gathering APIs directly and only using Claude for prose:

1. Expose each fact source as an Anthropic tool (e.g. `reverse_geocode`, `get_historical_weather`,
   `get_landmarks`).
2. Add one more tool, e.g. `submit_final_story`, whose input schema is the structured
   output you want. Instruct Claude to call it exactly once when done.
3. Run a tool-use loop: execute whichever tools Claude actually calls, feed results back as
   `tool_result` blocks, and capture each tool's raw result in a local accumulator keyed by tool
   name as you go.
4. When the loop sees `submit_final_story`, use the *accumulated tool results* (not a separate
   direct fetch) to populate structured DB columns alongside the narrative text.

**Why:** guarantees the stored structured data (weather, landmarks, etc.) always matches what the
narrative was actually grounded in — there's one source of truth instead of two independent calls
that could disagree (e.g. Claude paraphrasing weather it never actually looked up, or a direct
fetch returning a different day/location than what Claude used).

**How to apply:** any agentic pipeline where an LLM's tool calls should double as the source of
truth for structured fields displayed elsewhere in the UI, not just as context for prose.
