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
  const tools = [duckDuckGoTool];
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
