/* personal-assistant-thing/src/lib/ollama/tools/tool-runner.ts */

import { type Message, type ToolCall } from "ollama";
import { debug } from "@/src/lib/debug";
import { queryDuckDuckGo, fetchPage, queryWeather, queryWebSearch } from "@/src/lib/ollama/tools";

/**
 * Validates that a value is a non-empty string.
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates that a value is a valid timezone string or "auto".
 */
function isValidTimezone(value: unknown): value is string {
  return typeof value === "string" && (value === "auto" || value.trim().length > 0);
}

/**
 * Validates that a value is a valid forecast days number (1-16).
 */
function isValidForecastDays(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 16;
}

/**
 * Validates that a value is a valid URL string.
 */
function isValidUrl(value: unknown): value is string {
  if (!isValidString(value)) {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates tool call arguments based on the tool name.
 * Returns a validation error message if invalid, or null if valid.
 */
function validateToolArguments(
  name: string,
  args: unknown
): { query?: string; url?: string; timezone?: string; forecastDays?: number } | string {
  if (typeof args !== "object" || args === null) {
    return `Invalid arguments: expected object, got ${typeof args}`;
  }

  const argObj = args as Record<string, unknown>;

  if (name === "query_weather") {
    if (!isValidString(argObj.query)) {
      return "Missing or invalid 'query' parameter (must be a non-empty string)";
    }
    const validated: { query: string; timezone?: string; forecastDays?: number } = {
      query: argObj.query,
    };
    if (argObj.timezone !== undefined) {
      if (!isValidTimezone(argObj.timezone)) {
        return "Invalid 'timezone' parameter (must be a string or 'auto')";
      }
      validated.timezone = argObj.timezone;
    }
    if (argObj.forecastDays !== undefined) {
      if (!isValidForecastDays(argObj.forecastDays)) {
        return "Invalid 'forecastDays' parameter (must be an integer between 1 and 16)";
      }
      validated.forecastDays = argObj.forecastDays;
    }
    return validated;
  }

  if (name === "fetch_page") {
    if (!isValidUrl(argObj.url)) {
      return "Missing or invalid 'url' parameter (must be a valid URL string)";
    }
    return { url: argObj.url };
  }

  if (name === "query_web_search" || name === "query_duckduckgo") {
    if (!isValidString(argObj.query)) {
      return "Missing or invalid 'query' parameter (must be a non-empty string)";
    }
    return { query: argObj.query };
  }

  return `Unknown tool: ${name}`;
}

/**
 * Executes a tool call and returns the result.
 *
 * @param toolCall - The tool call from Ollama.
 * @returns The tool response with the execution result.
 */
export async function executeToolCall(toolCall: ToolCall): Promise<Message> {
  const { name, arguments: args } = toolCall.function;

  // Validate arguments before use
  const validationResult = validateToolArguments(name, args);
  if (typeof validationResult === "string") {
    const errorMessage = `Tool validation error: ${validationResult}`;
    debug(`[Tool] ${name} validation failed: ${validationResult}`);
    return {
      role: "tool",
      tool_name: name,
      content: `Error: ${errorMessage}`,
    };
  }

  const { query, url, timezone, forecastDays } = validationResult;

  type ToolName = "query_web_search" | "query_weather" | "query_duckduckgo" | "fetch_page";
  const tools: Record<ToolName, (query: string) => Promise<string>> = {
    query_web_search: queryWebSearch,
    query_weather: queryWeather,
    query_duckduckgo: queryDuckDuckGo,
    fetch_page: fetchPage,
  };

  let result: string;
  try {
    if (name === "query_weather") {
      result = await queryWeather(query!, timezone, forecastDays);
    } else if (name === "fetch_page") {
      result = await fetchPage(url!);
    } else if (name in tools) {
      result = await tools[name as ToolName](query!);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
    debug(`[Tool] ${name} completed (${result.length} chars)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    debug(`[Tool] ${name} failed: ${errorMessage}`);
    result = `Error: ${errorMessage}`;
  }

  return {
    role: "tool",
    tool_name: name,
    content: result,
  };
}
