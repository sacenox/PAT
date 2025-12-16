/* personal-assistant-thing/src/lib/ollama.ts */
// Wrapper using the official Ollama npm package.

import ollama from "ollama";
import { debug } from "./debug";

// Use types compatible with ollama package - use any to work around strict typing
type OllamaMessage = any;

export interface OllamaMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
}

/**
 * Queries DuckDuckGo's Instant Answer API for information about a given query.
 *
 * @param query - The search query to send to DuckDuckGo.
 * @returns A formatted string containing the instant answer information.
 */
export async function queryDuckDuckGo(query: string): Promise<string> {
  debug(`[DuckDuckGo] Querying: "${query}"`);

  try {
    const url = "https://api.duckduckgo.com/";
    const params = new URLSearchParams({
      q: query,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      debug(`[DuckDuckGo] Error: HTTP ${response.status}`);
      return `Error: Failed to fetch data from DuckDuckGo (${response.status})`;
    }

    const data = await response.json();
    debug(`[DuckDuckGo] Raw API response:`, JSON.stringify(data, null, 2));

    // Build a comprehensive response from available fields
    const parts: string[] = [];

    if (data.Heading) {
      parts.push(`Heading: ${data.Heading}`);
    }

    if (data.AbstractText) {
      parts.push(`Abstract: ${data.AbstractText}`);
    }

    if (data.AbstractURL) {
      parts.push(`Source: ${data.AbstractURL}`);
    }

    if (data.Answer) {
      parts.push(`Answer: ${data.Answer}`);
    }

    if (data.Definition) {
      parts.push(`Definition: ${data.Definition}`);
    }

    if (data.Type) {
      parts.push(`Type: ${data.Type}`);
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics.slice(0, 3)
        .map((topic: any) => topic.Text || topic.FirstURL)
        .filter(Boolean)
        .join(", ");
      if (topics) {
        parts.push(`Related Topics: ${topics}`);
      }
    }

    if (parts.length === 0) {
      // DuckDuckGo Instant Answer API has limitations - it doesn't support all query types
      // (e.g., weather forecasts, real-time data). This is expected behavior.
      debug(`[DuckDuckGo] No instant answer data available for this query type`);
      return `No instant answer available for query: "${query}". Note: DuckDuckGo Instant Answer API has limited coverage and may not support weather forecasts, real-time data, or certain query types.`;
    }

    return parts.join("\n\n");
  } catch (error) {
    console.error("DuckDuckGo query error:", error);
    return `Error querying DuckDuckGo: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
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
 * Defines the DuckDuckGo search tool for Ollama.
 */
export const duckDuckGoTool = {
  type: "function" as const,
  function: {
    name: "query_duckduckgo",
    description: "Query DuckDuckGo's Instant Answer API to get quick information about a topic, person, place, or concept. Use this when you need current or factual information that might not be in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to send to DuckDuckGo",
        },
      },
      required: ["query"],
    },
  },
};

/**
 * Defines the weather query tool for Ollama.
 */
export const weatherTool = {
  type: "function" as const,
  function: {
    name: "query_weather",
    description: "Query Open-Meteo's weather API to get current weather conditions and 3-day forecast for a location. Use this when users ask about weather, temperature, forecast, or current conditions for any location worldwide.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location name (e.g., 'New York', 'London', 'Tokyo', 'Paris'). Can be a city name, city with country, or more specific location.",
        },
      },
      required: ["location"],
    },
  },
};

/**
 * Executes a tool call and returns the result.
 *
 * @param toolCall - The tool call from Ollama.
 * @returns The tool response with the execution result.
 */
async function executeToolCall(toolCall: {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string | { [key: string]: any };
  };
}): Promise<OllamaMessage> {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

  debug(`[Tool] Executing: ${name}`, parsedArgs);

  switch (name) {
    case "query_duckduckgo":
      const result = await queryDuckDuckGo(parsedArgs.query);
      debug(`[Tool] ${name} completed, result length: ${result.length} chars`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        name: "query_duckduckgo",
        content: result,
      };
    case "query_weather":
      const weatherResult = await queryWeather(parsedArgs.location);
      debug(`[Tool] ${name} completed, result length: ${weatherResult.length} chars`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        name: "query_weather",
        content: weatherResult,
      };
    default:
      debug(`[Tool] Unknown tool: ${name}`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        name,
        content: `Error: Unknown tool "${name}"`,
      };
  }
}

/**
 * Sends messages to the Ollama model using the chat API and returns the generated response.
 * Supports tool calling - if the model requests tools, they are executed and the results
 * are sent back to the model for a final response.
 *
 * @param messages - Array of messages in the conversation history.
 * @param model - The Ollama model to use. Defaults to 'gpt-oss'.
 * @returns Object containing the response content and generation time in milliseconds.
 * @throws If the request fails.
 */
export async function fetchOllamaResponse(
  messages: OllamaMessageInput[],
  model = "gpt-oss"
): Promise<OllamaResponse> {
  const tools = [duckDuckGoTool, weatherTool];
  let totalDuration = 0;
  let currentMessages: OllamaMessage[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  const maxIterations = 10; // Prevent infinite loops
  let iterations = 0;

  debug(`[Ollama] Starting chat with model: ${model}, messages: ${messages.length}`);

  // Exhaust tool calls: Keep iterating until the model stops requesting tools
  // and returns a final response. Each iteration executes any requested tools
  // and sends the results back to the model for processing.
  while (iterations < maxIterations) {
    iterations++;
    debug(`[Ollama] Iteration ${iterations}/${maxIterations}, sending to model...`);

    const result = await ollama.chat({
      model,
      messages: currentMessages,
      tools,
    });

    totalDuration += result.total_duration;
    const iterationDuration = Math.round(result.total_duration / 1_000_000);

    debug(`[Ollama] Response received (${iterationDuration}ms), tool_calls: ${result.message.tool_calls?.length || 0}`);

    // If the model made tool calls, execute them and continue the conversation
    if (result.message.tool_calls && result.message.tool_calls.length > 0) {
      debug(`[Ollama] Tool calls detected:`, result.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        id: tc.id,
      })));

      // Add the assistant's message with tool calls (use result.message.tool_calls directly)
      currentMessages.push({
        role: "assistant",
        content: result.message.content || "",
        tool_calls: result.message.tool_calls,
      });

      // Execute all tool calls
      const toolResponses = await Promise.all(
        result.message.tool_calls.map((toolCall: any) =>
          executeToolCall({
            id: toolCall.id || toolCall.function.name,
            type: "function",
            function: {
              name: toolCall.function.name,
              arguments:
                typeof toolCall.function.arguments === "string"
                  ? toolCall.function.arguments
                  : toolCall.function.arguments,
            },
          })
        )
      );

      debug(`[Ollama] Tool responses received, continuing conversation...`);

      // Add tool responses to the conversation
      currentMessages.push(...toolResponses);
      continue;
    }

    // No tool calls, return the final response
    const content = result.message.content;
    const generationTimeMs = Math.round(totalDuration / 1_000_000); // Convert nanoseconds to milliseconds

    debug(`[Ollama] Final response (${generationTimeMs}ms total, ${iterations} iteration${iterations !== 1 ? "s" : ""}), content length: ${content.length} chars`);

    return { content, generationTimeMs };
  }

  // If we hit max iterations, return the last response
  debug(`[Ollama] Max iterations reached (${maxIterations}), getting final response...`);

  const lastResult = await ollama.chat({
    model,
    messages: currentMessages,
    tools,
  });
  totalDuration += lastResult.total_duration;
  const content = lastResult.message.content;
  const generationTimeMs = Math.round(totalDuration / 1_000_000);

  debug(`[Ollama] Final response after max iterations (${generationTimeMs}ms total, ${iterations} iterations), content length: ${content.length} chars`);

  return { content, generationTimeMs };
}
