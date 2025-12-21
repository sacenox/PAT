import { getCache, setCache } from "@/src/lib/cache";
import { createRateLimiter } from "@/src/lib/ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Rate limiter for weather API requests.
 * Tracks requests per 24-hour rolling window.
 */
const weatherRateLimiter = createRateLimiter({
  maxRequests: 1000,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "weather",
});

/**
 * Queries Open-Meteo's weather API for current weather and forecast information.
 * Results are cached for 6 hours.
 *
 * @param query - The location name (e.g., 'New York', 'London', 'Tokyo').
 * @param timezone - Timezone (e.g., 'America/New_York', 'Europe/London', 'auto'). Defaults to 'auto'.
 * @param forecastDays - Number of forecast days (1-16). Defaults to 3.
 * @returns A formatted string containing weather information or an error message.
 */
export async function queryWeather(
  query: string,
  timezone = "auto",
  forecastDays = 0
): Promise<string> {
  // Validate forecastDays (0 means no forecast, 1-16 for forecast days)
  const days = Math.max(0, Math.min(16, Math.round(forecastDays)));

  // Check cache first
  const cacheKey = `weather:${query.toLowerCase().trim()}:${timezone}:${days}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check rate limit before making the request
  const rateLimitCheck = await weatherRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    const hoursRemaining = rateLimitCheck.hoursUntilReset || 0;
    throw new Error(
      `Weather API rate limit exceeded. Maximum of 1000 requests per 24 hours has been reached. Please try again in approximately ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}.`
    );
  }

  // Increment rate limit counter before making the request
  // This ensures all API attempts are counted, not just successful ones
  await weatherRateLimiter.increment();

  const sanitizedQuery = query.trim();
  // First, geocode the location to get coordinates
  const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
  const geocodeParams = new URLSearchParams({
    name: sanitizedQuery,
    count: "1",
    language: "en",
    format: "json",
  });

  const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams.toString()}`);
  if (!geocodeResponse.ok) {
    throw new Error(`Failed to geocode location "${query}" (${geocodeResponse.status})`);
  }

  const geocodeData = await geocodeResponse.json();

  if (!geocodeData.results || geocodeData.results.length === 0) {
    throw new Error(
      `Could not find location "${query}". Please provide a more specific location name.`
    );
  }

  const { latitude, longitude, name, country, admin1 } = geocodeData.results[0];
  const locationName = `${name}${admin1 ? `, ${admin1}` : ""}${country ? `, ${country}` : ""}`;

  // Now fetch weather data - focus on temperature and precipitation
  const weatherUrl = "https://api.open-meteo.com/v1/forecast";
  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,precipitation",
    timezone: timezone,
  });

  // Only request daily forecast if forecastDays > 0
  if (days > 0) {
    weatherParams.append("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
    weatherParams.append("forecast_days", days.toString());
  }

  const weatherResponse = await fetch(`${weatherUrl}?${weatherParams.toString()}`);
  if (!weatherResponse.ok) {
    throw new Error(
      `Failed to fetch weather data for "${locationName}" (${weatherResponse.status})`
    );
  }

  const weatherData = await weatherResponse.json();

  // Format concise response focusing on temperature and precipitation
  const parts: string[] = [];
  parts.push(`${locationName}:`);

  // Current conditions
  if (weatherData.current) {
    const current = weatherData.current;
    const temp = current.temperature_2m;
    const precip = current.precipitation;
    if (temp !== undefined) {
      parts.push(`Now: ${temp}°C${precip !== undefined && precip > 0 ? `, ${precip}mm rain` : ""}`);
    }
  }

  // Daily forecast (only if forecastDays > 0)
  if (days > 0 && weatherData.daily && weatherData.daily.time) {
    for (let i = 0; i < Math.min(days, weatherData.daily.time.length); i++) {
      const date = new Date(weatherData.daily.time[i]);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const maxTemp = weatherData.daily.temperature_2m_max?.[i];
      const minTemp = weatherData.daily.temperature_2m_min?.[i];
      const precipitation = weatherData.daily.precipitation_sum?.[i];

      const tempStr =
        maxTemp !== undefined && minTemp !== undefined
          ? `${minTemp}°/${maxTemp}°C`
          : maxTemp !== undefined
            ? `${maxTemp}°C`
            : "";
      const precipStr =
        precipitation !== undefined && precipitation > 0 ? `, ${precipitation}mm` : "";

      if (tempStr) {
        parts.push(`${dayName}: ${tempStr}${precipStr}`);
      }
    }
  }

  const result = parts.join("\n");
  // Cache successful results
  await setCache(cacheKey, result, CACHE_TTL_MS);
  return result;
}

/**
 * Defines the weather query tool for Ollama.
 */
export const weatherTool = {
  type: "function" as const,
  function: {
    name: "query_weather",
    description:
      "Query Open-Meteo's weather API to get current weather conditions and optionally forecast for a location. Returns temperature and precipitation data. By default returns only current weather. Use forecastDays parameter to include forecast. Use this when users ask about weather, temperature, forecast, or current conditions for any location worldwide.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Location name (e.g., 'New York', 'London', 'Tokyo', 'Paris'). Can be a city name, city with country, or more specific location.",
        },
        timezone: {
          type: "string",
          description:
            "Timezone (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo'). Use 'auto' to automatically detect. Defaults to 'auto'.",
        },
        forecastDays: {
          type: "number",
          description:
            "Number of forecast days (0-16). Use 0 for current weather only (default), or 1-16 for forecast days.",
        },
      },
      required: ["query"],
    },
  },
};
