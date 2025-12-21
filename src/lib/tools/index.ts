/* personal-assistant-thing/src/lib/ollama/tools/index.ts */

import { queryDuckDuckGo } from "@/src/lib/tools/duckduckgo";
import { fetchPage } from "@/src/lib/tools/fetchpage";
import { queryWeather } from "@/src/lib/tools/weather";
import { queryWebSearch } from "@/src/lib/tools/websearch";
import type { ToolCall } from "ollama";

export { duckDuckGoTool, queryDuckDuckGo } from "@/src/lib/tools/duckduckgo";
export { fetchPage, fetchPageTool } from "@/src/lib/tools/fetchpage";
export { queryWeather, weatherTool } from "@/src/lib/tools/weather";
export { queryWebSearch, webSearchTool } from "@/src/lib/tools/websearch";

export async function executeToolCall(toolCall: ToolCall) {
  switch (toolCall.function.name) {
    case "query_weather":
      return await queryWeather(
        toolCall.function.arguments.query,
        toolCall.function.arguments.timezone,
        toolCall.function.arguments.forecastDays
      );
    case "fetch_page":
      return await fetchPage(toolCall.function.arguments.url);
    case "query_web_search":
      return await queryWebSearch(toolCall.function.arguments.query);
    case "query_duckduckgo":
      return await queryDuckDuckGo(toolCall.function.arguments.query);
    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`);
  }
}
