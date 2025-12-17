/* personal-assistant-thing/src/lib/ollama/weather.ts */

import { debug } from "../debug";

/**
 * Converts WMO weather code to human-readable description.
 * Based on WMO Weather interpretation codes (WW).
 */
function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[code] || `Weather code ${code}`;
}

/**
 * Queries Open-Meteo's weather API for current weather and forecast information.
 *
 * @param location - The location name (e.g., "New York", "London", "Tokyo").
 * @returns A formatted string containing weather information.
 */
export async function queryWeather(location: string): Promise<string> {
  debug(`[Weather] Querying weather for: "${location}"`);

  try {
    // First, geocode the location to get coordinates
    const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
    const geocodeParams = new URLSearchParams({
      name: location,
      count: "1",
      language: "en",
      format: "json",
    });

    const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams.toString()}`);
    if (!geocodeResponse.ok) {
      debug(`[Weather] Geocoding error: HTTP ${geocodeResponse.status}`);
      return `Error: Failed to geocode location "${location}" (${geocodeResponse.status})`;
    }

    const geocodeData = await geocodeResponse.json();
    debug(`[Weather] Geocoding response:`, JSON.stringify(geocodeData, null, 2));

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return `Error: Could not find location "${location}". Please provide a more specific location name.`;
    }

    const { latitude, longitude, name, country, admin1 } = geocodeData.results[0];
    const locationName = `${name}${admin1 ? `, ${admin1}` : ""}${country ? `, ${country}` : ""}`;

    debug(`[Weather] Found location: ${locationName} (${latitude}, ${longitude})`);

    // Now fetch weather data
    const weatherUrl = "https://api.open-meteo.com/v1/forecast";
    const weatherParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,weather_code,precipitation_probability",
      daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum",
      forecast_days: "3",
      timezone: "auto",
    });

    const weatherResponse = await fetch(`${weatherUrl}?${weatherParams.toString()}`);
    if (!weatherResponse.ok) {
      debug(`[Weather] Weather API error: HTTP ${weatherResponse.status}`);
      return `Error: Failed to fetch weather data for "${locationName}" (${weatherResponse.status})`;
    }

    const weatherData = await weatherResponse.json();
    debug(`[Weather] Weather API response:`, JSON.stringify(weatherData, null, 2));

    // Format the response
    const parts: string[] = [];
    parts.push(`Weather for ${locationName}:`);

    // Current conditions
    if (weatherData.current) {
      const current = weatherData.current;
      parts.push(`\nCurrent Conditions:`);
      parts.push(`  Temperature: ${current.temperature_2m}°C`);
      parts.push(`  Humidity: ${current.relative_humidity_2m}%`);
      parts.push(`  Wind Speed: ${current.wind_speed_10m} km/h`);
      if (current.wind_direction_10m !== undefined) {
        parts.push(`  Wind Direction: ${current.wind_direction_10m}°`);
      }
      if (current.weather_code !== undefined) {
        const weatherDesc = getWeatherDescription(current.weather_code);
        parts.push(`  Conditions: ${weatherDesc}`);
      }
    }

    // Daily forecast (next 3 days)
    if (weatherData.daily && weatherData.daily.time) {
      parts.push(`\n3-Day Forecast:`);
      for (let i = 0; i < Math.min(3, weatherData.daily.time.length); i++) {
        const date = new Date(weatherData.daily.time[i]);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const maxTemp = weatherData.daily.temperature_2m_max?.[i];
        const minTemp = weatherData.daily.temperature_2m_min?.[i];
        const weatherCode = weatherData.daily.weather_code?.[i];
        const precipitation = weatherData.daily.precipitation_sum?.[i];

        parts.push(`\n  ${dayName} (${date.toLocaleDateString()}):`);
        if (maxTemp !== undefined && minTemp !== undefined) {
          parts.push(`    High: ${maxTemp}°C, Low: ${minTemp}°C`);
        }
        if (weatherCode !== undefined) {
          parts.push(`    Conditions: ${getWeatherDescription(weatherCode)}`);
        }
        if (precipitation !== undefined && precipitation > 0) {
          parts.push(`    Precipitation: ${precipitation} mm`);
        }
      }
    }

    return parts.join("\n");
  } catch (error) {
    console.error("Weather query error:", error);
    return `Error querying weather: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Defines the weather query tool for Ollama.
 */
export const weatherTool = {
  type: "function" as const,
  function: {
    name: "query_weather",
    description:
      "Query Open-Meteo's weather API to get current weather conditions and 3-day forecast for a location. Use this when users ask about weather, temperature, forecast, or current conditions for any location worldwide.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            "The location name (e.g., 'New York', 'London', 'Tokyo', 'Paris'). Can be a city name, city with country, or more specific location.",
        },
      },
      required: ["location"],
    },
  },
};

