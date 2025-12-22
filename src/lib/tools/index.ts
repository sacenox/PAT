/* personal-assistant-thing/src/lib/ollama/tools/index.ts */

import { fetchPage } from "@/src/lib/tools/fetchpage";
import { webSearch } from "@/src/lib/tools/websearch";
import type { ToolCall } from "ollama";

export { fetchPage, fetchPageTool } from "@/src/lib/tools/fetchpage";
export { webSearch, webSearchTool } from "@/src/lib/tools/websearch";

export async function executeToolCall(toolCall: ToolCall) {
  switch (toolCall.function.name) {
    case "fetch_page":
      return await fetchPage(toolCall.function.arguments.url);
    case "web_search":
      return await webSearch(toolCall.function.arguments.query);
    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`);
  }
}
