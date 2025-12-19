/* personal-assistant-thing/src/lib/ollama/tools/tool-runner.ts */

import { type Message, type ToolCall } from "ollama";
import { debug } from "@/src/lib/debug";
import { queryDuckDuckGo, fetchPage, queryWeather, queryWebSearch } from "@/src/lib/ollama/tools";

/**
 * Executes a tool call and returns the result.
 *
 * @param toolCall - The tool call from Ollama.
 * @returns The tool response with the execution result.
 */
export async function executeToolCall(toolCall: ToolCall): Promise<Message> {
  const { name, arguments: args } = toolCall.function;
  const { query, url, timezone, forecastDays } = args as {
    query?: string;
    url?: string;
    timezone?: string;
    forecastDays?: number;
  };

  const tools = {
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
    } else {
      result = await tools[name](query!);
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
