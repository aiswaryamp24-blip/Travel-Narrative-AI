import { anthropic } from "@workspace/integrations-anthropic-ai";
import type Anthropic from "@anthropic-ai/sdk";

// The SDK exposes these via TS namespace-merging on the default `Anthropic`
// export (`declare namespace Anthropic { export { MessageParam, ... } }`),
// not as flat subpath exports — `@anthropic-ai/sdk/resources/messages`
// (and even `@anthropic-ai/sdk/resources`) has no "types" condition in the
// package's exports map, so importing from those subpaths fails to resolve
// under this project's "bundler" moduleResolution.
type MessageParam = Anthropic.MessageParam;
type ToolUnion = Anthropic.ToolUnion;
import {
  getHistoricalWeather,
  getLandmarks,
  reverseGeocode,
  type LandmarkResult,
  type WeatherResult,
} from "./research";
import type { PhotoImageBlock } from "./photoContent";
import type { DigestStyleValue } from "@workspace/db";

const MODEL = "claude-sonnet-4-5";
/** Reduced from 6 → 4 for faster per-day generation with no meaningful
 * quality loss: most locations are fully researched within 3 rounds. */
const MAX_TOOL_ROUNDS = 4;

/** Tone/register instruction per chosen visual style, so the prose reads
 * like it belongs to the magazine the traveler picked rather than always
 * defaulting to one house voice. canon-camera is the fallback/default
 * style, so its voice is the original BBC/broadsheet register this
 * pipeline always used. */
const STYLE_VOICE: Record<DigestStyleValue, string> = {
  "pop-art":
    "Write with punchy, high-energy pop-magazine verve: short, declarative sentences and bold, plainly stated claims, with a wink of playful attitude — like a glossy culture-magazine spread, not a breathless press release.",
  supermarket:
    "Write like a warm, practical weekend-supplement travel column: breezy, relatable, a little wry, favoring plain everyday language over literary flourish.",
  "camera-interface":
    "Write like precise field notes or a mission log: clipped, observational, almost technical — favor concrete data points and short declarative sentences over descriptive color.",
  "canon-camera":
    "Write in the register of a BBC Travel or broadsheet travel feature: precise, observational, quietly confident. Let specific, concrete detail carry the piece rather than breathless adjectives, superlatives, or exclamation points — understatement reads as more credible than enthusiasm.",
  "ios-core":
    "Write with clean, minimal, confident copy in the spirit of considered product writing: short declarative sentences, no wasted words, quietly polished rather than ornate.",
  "android-core":
    "Write with an open, detail-oriented, slightly technical enthusiast voice — precise and unpretentious, like a well-written project changelog crossed with a travel journal.",
};
const DEFAULT_STYLE_VOICE = STYLE_VOICE["canon-camera"];

const GEO_TOOLS: ToolUnion[] = [
  {
    name: "reverse_geocode",
    description:
      "Look up the human-readable place name (city/town and country) for a latitude/longitude pair.",
    input_schema: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lon: { type: "number" },
      },
      required: ["lat", "lon"],
    },
  },
  {
    name: "get_historical_weather",
    description:
      "Get the actual historical weather (max/min temp, precipitation, wind, conditions) and elevation for a location on a specific calendar date (YYYY-MM-DD).",
    input_schema: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lon: { type: "number" },
        date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["lat", "lon", "date"],
    },
  },
  {
    name: "get_landmarks",
    description:
      "Find notable nearby landmarks, attractions, historic sites, and natural features around a latitude/longitude.",
    input_schema: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lon: { type: "number" },
      },
      required: ["lat", "lon"],
    },
  },
];

/**
 * Builds the tool set for one day's research call. When there are no real
 * coordinates for this day (`hasReliableCoordinates: false`), the
 * geocode/weather/landmark tools are omitted entirely — rather than letting
 * Claude call them with a meaningless (0, 0) placeholder (which resolves to
 * a real spot in the Gulf of Guinea) or, worse, quietly substitute its own
 * guessed coordinates. Physically removing the tools makes this a hard
 * constraint instead of a prompt instruction Claude could ignore.
 */
function buildTools(hasReliableCoordinates: boolean, visualStyle: DigestStyleValue): ToolUnion[] {
  const voice = STYLE_VOICE[visualStyle] ?? DEFAULT_STYLE_VOICE;
  return [
    ...(hasReliableCoordinates ? GEO_TOOLS : []),
    {
      name: "submit_final_story",
      description:
        "Submit the finished, researched story for this day. Call this exactly once, only after you have gathered the facts you need with the other tools.",
      input_schema: {
        type: "object",
        properties: {
          locationName: {
            type: "string",
            description: hasReliableCoordinates
              ? "Human-readable place name for this day, e.g. 'Kyoto, Japan'."
              : "There is no GPS data for this day, so there is no verified location. Only name a specific place if it is unambiguously identifiable from the photos themselves (e.g. legible signage, an unmistakable famous landmark) — otherwise use a generic, non-specific description (e.g. 'a forest trail', 'an unspecified coastal town') rather than guessing a real place name.",
          },
          visualObservations: {
            type: "string",
            description:
              "Required scratchpad, written BEFORE the narrative. For EACH photo provided, note literally and specifically: how many people are visible (and any distinguishing appearance/clothing you can actually see), what they are physically doing, the concrete setting/backdrop (street, trail, beach, building, interior, etc.), and any weather/light actually visible in the frame (sunny, overcast, wet ground, etc.). Do not guess or embellish beyond what's visibly there — if a detail isn't visible, don't include it. This is for your own grounding, not shown to the reader.",
          },
          headline: {
            type: "string",
            description: "A short, evocative magazine-style headline for this day (under 12 words).",
          },
          narrative: {
            type: "string",
            description:
              "A complete short feature (3 tight paragraphs, roughly 180-260 words total) structured like a proper magazine article, not a caption: an opening paragraph that hooks the reader with one specific, concrete scene (never a throat-clearing summary sentence); a middle paragraph carrying the substance of the day" +
              (hasReliableCoordinates
                ? ", weaving in at least one concrete researched fact (temperature, a named landmark, elevation, precipitation) where the research supports it"
                : "") +
              "; and a closing paragraph (or final sentence) that actually lands the piece — a specific detail or observation that closes the day, never a trailing-off summary. Every sentence must be traceable to either visualObservations (what's actually in the photos: people, actions, setting)" +
              (hasReliableCoordinates
                ? " or the researched facts (weather, location, landmarks)"
                : " — there are no researched facts available for this day, so do not state a specific place name, temperature, or weather condition unless it is unmistakably visible in a photo") +
              " — no generic filler like 'wandered the charming streets' unless that's literally what the photos show. Prefer concrete, sensory, specific details over broad summary. Write in third person about 'the travelers'. No markdown headers. " +
              voice,
          },
        },
        required: ["locationName", "visualObservations", "headline", "narrative"],
      },
    },
  ];
}

export interface DayResearchContext {
  dayIndex: number;
  date: string;
  lat: number;
  lon: number;
  locationInferred: boolean;
  /** true when NO photo anywhere in the trip has GPS data, so lat/lon are a
   * meaningless (0, 0) placeholder — geocode/weather/landmark tools are
   * withheld entirely in this case rather than researching a fake location. */
  noGpsInTrip: boolean;
  photoCount: number;
  tripTitle: string;
  /** The trip's chosen visual style — shapes the narrative's tone/register
   * (see STYLE_VOICE) so the writing suits whatever magazine style the
   * traveler picked, not just the story page's colors/fonts. */
  visualStyle: DigestStyleValue;
  /** A representative sample of this day's actual photos, downsized for
   * vision input — lets Claude ground the narrative in what's genuinely
   * depicted (people, activity, setting) instead of inventing it. */
  photoImages: PhotoImageBlock[];
}

export interface DayStoryResult {
  locationName: string;
  headline: string;
  narrative: string;
  weather: WeatherResult | null;
  landmarks: LandmarkResult[];
  elevationMeters: number | null;
}

/** Formats an ISO capture timestamp as a plain local-looking time (e.g.
 * "10:09 AM"). Timestamps are stored as the wall-clock time the photo was
 * actually taken (see use-upload-flow.ts's EXIF handling), reinterpreted as
 * UTC to sidestep browser-timezone distortion — so formatting in UTC here
 * correctly reproduces the original capture time, not a shifted one. */
function formatPhotoTime(takenAt: string | null): string | null {
  if (!takenAt) return null;
  const date = new Date(takenAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: unknown; weather?: WeatherResult; landmarks?: LandmarkResult[] }> {
  switch (name) {
    case "reverse_geocode": {
      const result = await reverseGeocode(input.lat as number, input.lon as number);
      return { result };
    }
    case "get_historical_weather": {
      const weather = await getHistoricalWeather(
        input.lat as number,
        input.lon as number,
        input.date as string,
      );
      return { result: weather, weather };
    }
    case "get_landmarks": {
      const landmarks = await getLandmarks(input.lat as number, input.lon as number);
      return { result: { landmarks }, landmarks };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Runs an agentic tool-calling loop where Claude researches one day of a
 * trip (location, weather, landmarks) via tool calls, then submits a
 * structured story via the `submit_final_story` tool. Structured facts
 * (weather/landmarks) are captured directly from whichever tool calls
 * Claude actually makes, so the DB row always matches what the story is
 * grounded in.
 */
export async function researchAndWriteDay(
  ctx: DayResearchContext,
): Promise<DayStoryResult> {
  const hasPhotos = ctx.photoImages.length > 0;
  const hasReliableCoordinates = !ctx.noGpsInTrip;
  const voice = STYLE_VOICE[ctx.visualStyle] ?? DEFAULT_STYLE_VOICE;
  const tools = buildTools(hasReliableCoordinates, ctx.visualStyle);

  const systemPrompt = `You are a travel correspondent for a magazine-style trip journal. You are researching day ${ctx.dayIndex + 1} of a trip titled "${ctx.tripTitle}".

${
  hasReliableCoordinates
    ? `You have been given the approximate GPS coordinates for this day (derived from photo metadata)${ctx.locationInferred ? " — note: no photo on this specific day had GPS data, so this location was inferred from surrounding days and may be approximate" : ""}${hasPhotos ? `, plus ${ctx.photoImages.length} of the actual photos taken that day (attached below, in roughly chronological order).` : ", but none of that day's photos could be loaded for you to view."}`
    : `No photo anywhere in this trip has GPS data, so there are no real coordinates for this day${hasPhotos ? ` — but you do have ${ctx.photoImages.length} of the actual photos taken that day (attached below, in roughly chronological order) to work from.` : ", and no photos could be loaded either, so you have almost nothing to go on."}`
}

${
  hasReliableCoordinates
    ? `Use the tools available to research the real place, weather, and nearby landmarks before writing. Always call reverse_geocode first, then get_historical_weather and get_landmarks. Once you have enough material, call submit_final_story exactly once with your finished piece. Do not call any tool after submit_final_story.`
    : `You have no reverse-geocoding, weather, or landmark tools available for this day, because there are no real coordinates to research with — do not invent or guess coordinates. Call submit_final_story exactly once, based only on what's genuinely visible in the photos.`
}

Accuracy rules — follow these strictly, since real people will read this as a factual account of their own trip:
${
  hasPhotos
    ? `- First, fill in visualObservations by literally describing each provided photo: how many people are visible (described generically — e.g. "a couple", "a group of friends" — never invent names, ages, or identities you can't actually know), what they're doing, the setting, and any weather/light actually visible. This is mandatory grounding work, not optional — do it even if it feels repetitive.`
    : `- You have no photos to look at for this day. Note that in visualObservations, and keep the narrative grounded strictly in whatever real facts you have (if any) rather than inventing scenes or activity you can't verify.`
}
${
  hasReliableCoordinates
    ? `- Weather in the narrative is ground truth ONLY from get_historical_weather's "conditions" and "precipitationMm" fields — never mention rain, drizzle, showers, snow, or storms unless precipitationMm is greater than 0 or "conditions" explicitly names that precipitation type. If precipitationMm is 0 or null, describe the day as dry. Do not upgrade "partly cloudy" into anything wetter than what the tool returned, and do not invent atmospheric details (fog, humidity, wind chill, etc.) that aren't in the tool's data. You may describe visible light/sky (golden hour, bright midday sun) if it's actually visible in a photo and doesn't contradict the tool's data.`
    : `- You have no weather data for this day. Do not state a specific temperature, condition (rain, sun, snow, etc.), or forecast-style claim — you may only describe weather/light that is unmistakably visible in a photo (e.g. visibly wet ground, snow on the ground, bright sunlight), and even then, describe just what's visible rather than asserting a broader daily forecast.`
}
- The narrative must be built from visualObservations plus whatever real researched facts are available — every sentence should trace back to one of those sources, never invented. No stock travel-writing filler ("wandered the charming streets", "a tapestry of culture", "as the sun dipped below the horizon") unless it's literally what a photo shows.
${
  hasReliableCoordinates
    ? `- The narrative text itself (not just the locationName field) must explicitly name the city/town and country visited that day at least once, in prose — don't leave the reader to infer it only from the headline or metadata.`
    : `- Do not name a specific city, region, or country unless it is unambiguously identifiable from the photos themselves (e.g. legible signage, an unmistakable famous landmark) — if you can't be sure, describe the setting generically instead of guessing a place name.`
}
- If people are visible in photos, describe what they're actually doing (the action) rather than just noting their presence — specificity here is what makes the story feel true to the day.
- Do not describe activities, objects, or people that aren't visible in the provided photos, and don't state a numeric distance traveled in the narrative — the app displays that separately.
${hasPhotos ? `- Each photo below is labeled with its capture time. Use that to give the day genuine temporal shape — how it began, what happened by midday, how it wound down — rather than describing the photos as an undifferentiated list. Only reference specific times/sequence you can actually see in those labels, don't invent a schedule.\n` : ""}- ${voice}
- Structure the piece like a proper feature article, not a photo caption: a hook to open, the substance of the day in the middle${hasReliableCoordinates ? " (grounded in at least one concrete researched fact when the research supports it)" : ""}, and a closing line that actually closes — never trail off into a summary sentence. Three tight, information-dense paragraphs beat two thin ones or five padded ones. Cut any sentence that isn't doing real work.`;

  const userText = `Day ${ctx.dayIndex + 1} — date: ${ctx.date}
${hasReliableCoordinates ? `Coordinates: ${ctx.lat.toFixed(4)}, ${ctx.lon.toFixed(4)}\n` : ""}Photos taken that day: ${ctx.photoCount}${hasPhotos ? ` (${ctx.photoImages.length} attached below for you to look at, each labeled with its capture time)` : ""}

Research this day and write the story.`;

  const userContent: MessageParam["content"] = [
    { type: "text", text: userText },
    ...ctx.photoImages.flatMap((img) => {
      const time = formatPhotoTime(img.takenAt);
      return [
        ...(time ? [{ type: "text" as const, text: `Photo taken at ${time}:` }] : []),
        {
          type: "image" as const,
          source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
        },
      ];
    }),
  ];

  const messages: MessageParam[] = [{ role: "user", content: userContent }];

  let capturedWeather: WeatherResult | null = null;
  let capturedLandmarks: LandmarkResult[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3072,
      system: systemPrompt,
      tools,
      messages,
    });

    const finalCall = response.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_final_story",
    );

    if (finalCall && finalCall.type === "tool_use") {
      const input = finalCall.input as {
        locationName: string;
        visualObservations: string;
        headline: string;
        narrative: string;
      };
      // Type assertion (not just an annotation) is required here: `weather`
      // is mutated inside a nested closure (see the tool-result Promise.all
      // below), which collapses TS's control-flow narrowing on read to
      // `never` — an assertion bypasses CFA instead of relying on it.
      const weather = capturedWeather as WeatherResult | null;
      const elevationMeters: number | null = weather === null ? null : weather.elevationMeters;
      return {
        locationName: input.locationName,
        headline: input.headline,
        narrative: input.narrative,
        weather,
        landmarks: capturedLandmarks,
        elevationMeters,
      };
    }

    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      // Claude stopped without calling submit_final_story — nudge it once more.
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content:
          "Please call submit_final_story now with your finished, researched story.",
      });
      continue;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (block.type !== "tool_use") throw new Error("unreachable");
        try {
          const { result, weather, landmarks } = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
          );
          if (weather) capturedWeather = weather;
          if (landmarks) capturedLandmarks = landmarks;
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        } catch (error) {
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            is_error: true,
          };
        }
      }),
    );

    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(
    `Claude did not submit a final story for day ${ctx.dayIndex + 1} within ${MAX_TOOL_ROUNDS} tool rounds`,
  );
}
