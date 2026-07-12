import { anthropic } from "@workspace/integrations-anthropic-ai";
import type { MessageParam, ToolUnion } from "@anthropic-ai/sdk/resources/messages";
import {
  getHistoricalWeather,
  getLandmarks,
  reverseGeocode,
  type LandmarkResult,
  type WeatherResult,
} from "./research";

const MODEL = "claude-sonnet-4-5";
const MAX_TOOL_ROUNDS = 6;

const TOOLS: ToolUnion[] = [
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
  {
    name: "submit_final_story",
    description:
      "Submit the finished, researched story for this day. Call this exactly once, only after you have gathered the facts you need with the other tools.",
    input_schema: {
      type: "object",
      properties: {
        locationName: {
          type: "string",
          description: "Human-readable place name for this day, e.g. 'Kyoto, Japan'.",
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
            "2 tight paragraphs (roughly 90-150 words total) of vivid, specific travel journalism about this day. Every sentence must be traceable to either visualObservations (what's actually in the photos: people, actions, setting) or the researched facts (weather, location, landmarks) — no generic filler like 'wandered the charming streets' unless that's literally what the photos show. Prefer concrete, sensory, specific details over broad summary. Write in third person about 'the travelers'. No markdown headers.",
        },
      },
      required: ["locationName", "visualObservations", "headline", "narrative"],
    },
  },
];

export interface PhotoImage {
  base64: string;
  mediaType: string;
}

export interface DayResearchContext {
  dayIndex: number;
  date: string;
  lat: number;
  lon: number;
  locationInferred: boolean;
  distanceKm: number | null;
  photoCount: number;
  /** A handful of this day's actual photos, so the story can be grounded in
   * what's really depicted rather than guessed purely from GPS/metadata. */
  photoImages: PhotoImage[];
  tripTitle: string;
}

export interface DayStoryResult {
  locationName: string;
  headline: string;
  narrative: string;
  weather: WeatherResult | null;
  landmarks: LandmarkResult[];
  elevationMeters: number | null;
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
  const systemPrompt = `You are a travel correspondent for a magazine-style trip journal. You are researching day ${ctx.dayIndex + 1} of a trip titled "${ctx.tripTitle}".

You have been given the approximate GPS coordinates for this day (derived from photo metadata)${ctx.locationInferred ? " — note: no photo on this specific day had GPS data, so this location was inferred from surrounding days and may be approximate" : ""}, and a sample of the travelers' actual photos from that day. Use the tools available to research the real place, weather, and nearby landmarks before writing. Always call reverse_geocode first, then get_historical_weather and get_landmarks. Once you have enough material, call submit_final_story exactly once with your finished piece. Do not call any tool after submit_final_story.

Accuracy rules — follow these strictly, since real people will read this as a factual account of their own trip:
- First, fill in visualObservations by literally describing each provided photo: how many people, what they're doing, the setting, and any weather/light actually visible. This is mandatory grounding work, not optional — do it even if it feels repetitive.
- Weather in the narrative is ground truth ONLY from get_historical_weather's "conditions" and "precipitationMm" fields — never mention rain, drizzle, showers, snow, or storms unless precipitationMm is greater than 0 or "conditions" explicitly names that precipitation type. If precipitationMm is 0 or null, describe the day as dry. Do not upgrade "partly cloudy" into anything wetter than what the tool returned, and do not invent atmospheric details (fog, humidity, wind chill, etc.) that aren't in the tool's data. You may describe visible light/sky (golden hour, bright midday sun) if it's actually visible in a photo and doesn't contradict the tool's data.
- The narrative must be built from visualObservations plus the researched facts (place, weather, landmarks) — every sentence should trace back to one of those two sources. No stock travel-writing filler ("wandered the charming streets", "a tapestry of culture", "as the sun dipped below the horizon") unless it's literally what a photo shows.
- The narrative text itself (not just the locationName field) must explicitly name the city/town and country visited that day at least once, in prose — don't leave the reader to infer it only from the headline or metadata.
- If people are visible in photos, describe what they're actually doing (the action) rather than just noting their presence — specificity here is what makes the story feel true to the day.
- Do not describe activities, objects, or people that aren't visible in the provided photos, and don't state a numeric distance traveled in the narrative — the app displays that separately.
- Keep it succinct and compelling: two tight, information-dense paragraphs beat four padded ones. Cut any sentence that isn't doing real work.`;

  const userContent = `Day ${ctx.dayIndex + 1} — date: ${ctx.date}
Coordinates: ${ctx.lat.toFixed(4)}, ${ctx.lon.toFixed(4)}
Photos taken that day: ${ctx.photoCount}${ctx.photoImages.length > 0 ? ` (${ctx.photoImages.length} shown below for visual reference)` : " (none available for visual reference)"}

Research this day and write the story.`;

  const initialContent: MessageParam["content"] =
    ctx.photoImages.length > 0
      ? [
          { type: "text", text: userContent },
          ...ctx.photoImages.map(
            (img) =>
              ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: img.base64,
                },
              }) as const,
          ),
        ]
      : userContent;

  const messages: MessageParam[] = [{ role: "user", content: initialContent }];

  let capturedWeather: WeatherResult | null = null;
  let capturedLandmarks: LandmarkResult[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3072,
      system: systemPrompt,
      tools: TOOLS,
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
      return {
        locationName: input.locationName,
        headline: input.headline,
        narrative: input.narrative,
        weather: capturedWeather,
        landmarks: capturedLandmarks,
        elevationMeters: capturedWeather?.elevationMeters ?? null,
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
