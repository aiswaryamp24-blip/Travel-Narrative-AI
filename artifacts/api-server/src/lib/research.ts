/**
 * Direct clients for the free, keyless public APIs used to research each day
 * of a trip: OpenStreetMap Nominatim (reverse geocoding), Open-Meteo
 * (historical weather + elevation), and Overpass (nearby landmarks).
 *
 * These are exposed to Claude as tools in narrative.ts — Claude decides when
 * to call them while researching a day's story.
 */

const USER_AGENT = "trip-correspondent/1.0 (Replit agentic travel journal app)";

export interface GeocodeResult {
  locationName: string;
  country: string | null;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<GeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocode failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  const address = data.address ?? {};
  const place =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    address.state ??
    data.display_name?.split(",")[0] ??
    "an unknown location";
  const country = address.country ?? null;

  return {
    locationName: country ? `${place}, ${country}` : place,
    country,
  };
}

export interface WeatherResult {
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationMm: number | null;
  windSpeedMaxKmh: number | null;
  weatherCode: number | null;
  conditions: string | null;
  elevationMeters: number | null;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "heavy freezing rain",
  71: "light snow",
  73: "moderate snow",
  75: "heavy snow",
  77: "snow grains",
  80: "light rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "light snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with light hail",
  99: "thunderstorm with heavy hail",
};

export async function getHistoricalWeather(
  lat: number,
  lon: number,
  date: string,
): Promise<WeatherResult> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
  );
  // "auto" resolves the local timezone from lat/lon, so the daily
  // aggregation lines up with the destination's calendar day rather than
  // UTC's — otherwise a day's weather could bleed across the UTC day
  // boundary for locations that aren't UTC-aligned.
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo archive request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    elevation?: number;
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      wind_speed_10m_max?: number[];
      weather_code?: number[];
    };
  };

  const daily = data.daily;
  const weatherCode = daily?.weather_code?.[0] ?? null;

  return {
    tempMaxC: daily?.temperature_2m_max?.[0] ?? null,
    tempMinC: daily?.temperature_2m_min?.[0] ?? null,
    precipitationMm: daily?.precipitation_sum?.[0] ?? null,
    windSpeedMaxKmh: daily?.wind_speed_10m_max?.[0] ?? null,
    weatherCode,
    conditions: weatherCode != null ? WEATHER_CODE_LABELS[weatherCode] ?? null : null,
    elevationMeters: data.elevation ?? null,
  };
}

export interface LandmarkResult {
  name: string;
  kind: string;
  distanceMeters: number | null;
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getLandmarks(
  lat: number,
  lon: number,
  radiusMeters = 4000,
): Promise<LandmarkResult[]> {
  const query = `
    [out:json][timeout:20];
    (
      node["tourism"~"attraction|museum|viewpoint|artwork|gallery"](around:${radiusMeters},${lat},${lon});
      node["historic"](around:${radiusMeters},${lat},${lon});
      node["natural"~"peak|volcano|beach|waterfall"](around:${radiusMeters},${lat},${lon});
      way["tourism"~"attraction|museum|viewpoint"](around:${radiusMeters},${lat},${lon});
      way["historic"](around:${radiusMeters},${lat},${lon});
    );
    out center tags 20;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const elements = data.elements ?? [];

  const landmarks: LandmarkResult[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;

    const kind =
      tags.tourism ?? tags.historic ?? tags.natural ?? "landmark";

    landmarks.push({
      name,
      kind,
      distanceMeters: Math.round(haversineMeters(lat, lon, elLat, elLon)),
      lat: elLat,
      lon: elLon,
    });
  }

  return landmarks
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
    .slice(0, 8);
}
