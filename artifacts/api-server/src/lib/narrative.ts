import { anthropic } from "@workspace/integrations-anthropic-ai";
import type { MessageParam, ToolUnion } from "@anthropic-ai/sdk/resources/messages";
import {
  getHistoricalWeather,
  getLandmarks,
  reverseGeocode,
  type LandmarkResult,
  type WeatherResult,
} from "./research";
import type { PhotoImageBlock } from "./photoContent";

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
        headline: {
          type: "string",
          description: "A short, evocative magazine-style headline for this day (under 12 words).",
        },
        narrative: {
          type: "string",
          description:
            "2-4 paragraphs of vivid, specific, magazine-style travel journalism about this day. Ground every claim in either (a) what is genuinely visible in the attached photos, or (b) facts returned by the research tools (weather, landmarks) — never invent details, people, or events that aren't supported by one of those two sources. Must explicitly name the city/town and country at least once. Write in third person about 'the travelers'. No markdown headers.",
        },
      },
      required: ["locationName", "headline", "narrative"],
    },
  },
];

export interface DayResearchContext {
  dayIndex: number;
  date: string;
  lat: number;
  lon: number;
  locationInferred: boolean;
  photoCount: number;
  tripTitle: string;
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

  const systemPrompt = `You are a travel correspondent for a magazine-style trip journal. You are researching day ${ctx.dayIndex + 1} of a trip titled "${ctx.tripTitle}".

You have been given the approximate GPS coordinates for this day (derived from photo metadata)${ctx.locationInferred ? " — note: no photo on this specific day had GPS data, so this location was inferred from surrounding days and may be approximate" : ""}${hasPhotos ? `, plus ${ctx.photoImages.length} of the actual photos taken that day (attached below, in roughly chronological order).` : ", but none of that day's photos could be loaded for you to view."}

${hasPhotos ? `Look closely at the attached photos before writing. Describe only what you can genuinely see: who appears to be present (described generically — e.g. "a couple", "a group of friends" — never invent names, ages, or identities you can't actually know), what they appear to be doing, the setting, and any concrete visual detail that grounds the scene. If the photos don't show something (a specific activity, a specific place), do not claim it happened — write around what's actually visible instead of inventing filler.` : "You have no photos to look at for this day, so keep the narrative grounded strictly in the researched facts below rather than inventing scenes or activity you can't verify."}

Use the tools available to research the real place, weather, and nearby landmarks before writing. Always call reverse_geocode first, then get_historical_weather and get_landmarks. Your finished narrative must explicitly name the city/town and country you found (not just imply a region) at least once. Once you have enough material, call submit_final_story exactly once with your finished piece. Do not call any tool after submit_final_story.`;

  const userText = `Day ${ctx.dayIndex + 1} — date: ${ctx.date}
Coordinates: ${ctx.lat.toFixed(4)}, ${ctx.lon.toFixed(4)}
Photos taken that day: ${ctx.photoCount}${hasPhotos ? ` (${ctx.photoImages.length} attached below for you to look at)` : ""}

Research this day and write the story.`;

  const userContent: MessageParam["content"] = [
    { type: "text", text: userText },
    ...ctx.photoImages.map((img) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
    })),
  ];

  const messages: MessageParam[] = [{ role: "user", content: userContent }];

  let capturedWeather: WeatherResult | null = null;
  let capturedLandmarks: LandmarkResult[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
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
