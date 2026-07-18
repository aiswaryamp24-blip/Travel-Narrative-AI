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
              "Required scratchpad completed BEFORE writing the narrative — mandatory, never skipped. For EACH photo (numbered in order), record with forensic precision: " +
              "(1) PEOPLE — exact count visible; what they are physically doing (not 'relaxing' but 'sitting at a table with a coffee cup'); visible clothing colour and style; any legible text on clothing or bags; group arrangement. NEVER invent names, ages, or relationships. " +
              "(2) SETTING — indoors or outdoors? Exact type (restaurant interior, cobbled street, train platform, mountain trail, beach, market stall, etc.); materials and architectural style visible; any signage, vehicle types, or cultural markers that could indicate a country or city; what is in the background. " +
              "(3) WEATHER & LIGHT — sky colour, cloud cover, shadow direction, wet pavement, umbrellas, coats, snow, dust — only what is literally visible in the frame. Never infer from the season or trip title. " +
              "(4) GPS CHECK — if this photo has GPS coordinates labeled on it, note them; if they are flagged as far from the day centroid, note the discrepancy and that you will geocode those coordinates. " +
              "Be blunt and literal — 'cannot determine' is better than a guess. This scratchpad is for your grounding only, not shown to the reader.",
          },
          headline: {
            type: "string",
            description: "A short, evocative magazine-style headline for this day (under 12 words).",
          },
          narrative: {
            type: "string",
            description:
              "A complete short feature (3 tight paragraphs, roughly 180-260 words total) structured like a proper magazine article, not a caption: an opening paragraph that hooks the reader with one specific, concrete scene from visualObservations (never a throat-clearing summary sentence); a middle paragraph carrying the substance of the day" +
              (hasReliableCoordinates
                ? ", weaving in at least one concrete researched fact (actual temperature with degrees, a named landmark, elevation, precipitation amount) where the research supports it"
                : "") +
              "; and a closing paragraph (or final sentence) that actually lands the piece — a specific detail or observation that closes the day, never a trailing-off summary. " +
              "LOCATION ACCURACY IS NON-NEGOTIABLE: if photos were taken in different cities (identified by their GPS coordinates), name each city correctly in the narrative — do not let the trip title, day centroid, or a desire for a tidy story override what the photo GPS actually tells you. A photo labeled as being from a different city MUST be written about as being from that city. " +
              "WEATHER must come from get_historical_weather data only — never invented. Describe it with the actual recorded temperature (e.g. '29°C') and condition (e.g. 'clear skies', 'light rain — 2.1 mm recorded'). " +
              "PEOPLE — describe exactly what they are doing (specific action, not 'enjoying themselves'), their visible clothing, their apparent number. No invented names, ages, or identities. " +
              "SETTING — name specific visible architectural features, street types, vegetation, signage. Never 'charming streets', 'vibrant culture', or any stock phrase that could apply to any city on Earth. " +
              "Every sentence must be traceable to either visualObservations or researched facts" +
              (hasReliableCoordinates ? "" : " — no researched facts are available, so do not state a temperature, condition, or place name unless visible in a photo") +
              ". Write in third person. No markdown. " +
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

/** Approximate distance (km) above which a photo's own GPS is considered to
 * be from a genuinely different city rather than just GPS drift/noise. */
const LOCATION_DISCREPANCY_KM = 30;

/** Inline haversine — avoids importing from geo.ts to keep narrative.ts
 * self-contained, and is called at most once per photo per day. */
function photoDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    ? `- First, complete visualObservations for each photo with forensic precision before writing anything else — it is mandatory, not optional. Cover all four categories: people (count, action, clothing details), setting (type, materials, visible cultural markers), weather/light (only what is literally visible in the frame), and GPS check (note the coordinates and any discrepancy flag). "Cannot determine" is always better than a guess.`
    : `- You have no photos for this day. Note that in visualObservations and keep the narrative grounded strictly in researched facts rather than inventing scenes.`
}
${
  hasReliableCoordinates
    ? `- LOCATION ACCURACY — CRITICAL: Photos below are labeled with their individual GPS coordinates. When a photo is flagged "⚠️ DIFFERENT CITY", its GPS places it ${LOCATION_DISCREPANCY_KM}+ km from the day centroid — it was physically taken in a different place. You MUST call reverse_geocode with THAT PHOTO'S coordinates (not the day centroid) to identify the real location. Write about that photo using its actual location. The trip title and day centroid do NOT override individual photo GPS — photo GPS is ground truth. This is the most common cause of factual errors in travel narratives.`
    : ``
}
${
  hasReliableCoordinates
    ? `- Weather in the narrative comes ONLY from get_historical_weather's actual returned values — include the real temperature in degrees and the exact condition string. Never mention precipitation (rain, drizzle, snow, storms) unless precipitationMm > 0 or the conditions field explicitly names it. Never invent atmospheric details not in the tool data. You may additionally describe sky/light that is literally visible in a photo if it doesn't contradict the tool data.`
    : `- You have no weather data. Do not state any temperature or weather condition — only describe light or weather that is unmistakably visible in a photo frame (wet pavement, snow on ground, bright sunlight casting shadows).`
}
- Every sentence in the narrative must be traceable to either visualObservations (what is literally visible) or researched tool data. Zero invented detail. No stock filler ("charming streets", "tapestry of culture", "as the sun dipped", "vibrant atmosphere") — these phrases are banned. If you catch yourself writing one, replace it with a specific visual or factual detail.
- Describe people by their exact visible action, not mood or intent: "stood at a counter holding a paper cup" not "enjoyed a morning coffee". Describe weather with the actual recorded temperature and condition from tool data, not impressions.
${
  hasReliableCoordinates
    ? `- The narrative must name the city/country of each location explicitly in prose at least once — especially when photos came from different cities.`
    : `- Do not name a specific city or country unless it is unambiguously identifiable from photos (legible signage, unmistakable landmark).`
}
- Do not invent activities, objects, or people not visible in photos. Do not state numeric distance traveled — the app shows that separately.
${hasPhotos ? `- Each photo is labeled with its capture time and GPS (where available). Use the time sequence to give the day genuine temporal shape. Only reference times you can see in the labels.\n` : ""}- ${voice}
- Structure like a proper magazine feature: a hook that opens on one specific concrete scene; substance in the middle grounded in real facts; a closing line that actually ends the day — never a trailing summary. Three dense paragraphs. Cut every sentence that isn't doing real work.`;

  const userText = `Day ${ctx.dayIndex + 1} — date: ${ctx.date}
${hasReliableCoordinates ? `Coordinates: ${ctx.lat.toFixed(4)}, ${ctx.lon.toFixed(4)}\n` : ""}Photos taken that day: ${ctx.photoCount}${hasPhotos ? ` (${ctx.photoImages.length} attached below for you to look at, each labeled with its capture time)` : ""}

Research this day and write the story.`;

  const userContent: MessageParam["content"] = [
    { type: "text", text: userText },
    ...ctx.photoImages.flatMap((img) => {
      const time = formatPhotoTime(img.takenAt);
      const parts: string[] = [];
      if (time) parts.push(`taken at ${time}`);

      // Attach per-photo GPS so Claude can detect location discrepancies.
      // When the photo's own GPS differs significantly from the day centroid,
      // flag it explicitly — this is the primary mechanism for catching "Polish
      // photo on a Prague day" style errors.
      if (img.lat != null && img.lon != null && hasReliableCoordinates) {
        const distKm = photoDistanceKm(ctx.lat, ctx.lon, img.lat, img.lon);
        parts.push(`GPS: ${img.lat.toFixed(4)}, ${img.lon.toFixed(4)}`);
        if (distKm > LOCATION_DISCREPANCY_KM) {
          parts.push(
            `⚠️ DIFFERENT CITY — ${Math.round(distKm)} km from day centroid. Geocode these coordinates separately and write about this photo using its real location, not the day centroid.`,
          );
        }
      }

      const label = parts.length > 0 ? `Photo ${parts.join(" | ")}:` : "Photo:";
      return [
        { type: "text" as const, text: label },
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
