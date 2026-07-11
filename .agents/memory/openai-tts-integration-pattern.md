---
name: OpenAI TTS via AI Integrations for server-side narration
description: How to add live in-app text-to-speech using Replit's OpenAI AI Integration, and why the media-generation skill's TTS callback doesn't work for this.
---

The `media-generation`/`audio-generation` skill's `textToSpeech` callback is
CodeExecution-sandbox-only — it's for generating static assets during the
agent's own session, not something a running Express/backend server can call
at request time for arbitrary user data (e.g. narrating dynamically generated
trip text on demand).

For live in-app TTS/STT triggered by end-user requests, use the OpenAI AI
Integration instead: provision it with `setupReplitAIIntegrations({
providerSlug: "openai" })`, then use the `textToSpeech`/`speechToText` helpers
from the copied `lib/integrations-openai-ai-server/src/audio/client.ts`
template (uses `gpt-audio` chat-completions under the hood, not the literal
`/v1/audio/speech` endpoint). No personal API key needed; billed to Replit
credits — tell the user this when you provision it.

**Why:** confirmed by reading both skills in the same session — media-generation
explicitly scopes its audio callbacks to the sandbox notebook, while
ai-integrations-openai is the documented path for server-side runtime calls.

**How to apply:** when a feature needs synthesized speech/transcription
generated in response to a live user action (not a one-off asset for the
current chat), reach for the OpenAI AI Integration server template, not the
media-generation skill.
