/* personal-assistant-thing/src/lib/ollama/index.ts */
// Wrapper using the official Ollama npm package.

import ollama from "ollama";
import { debug } from "../debug";
import { queryDuckDuckGo, duckDuckGoTool } from "./duckduckgo";
import { queryWeather, weatherTool } from "./weather";
import { queryWebSearch, webSearchTool } from "./websearch";

// Use types compatible with ollama package - use any to work around strict typing
type OllamaMessage = any;

export interface OllamaMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
  toolCalls?: any[]; // Array of tool calls made during the conversation
}

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
    case "query_web_search":
      const webSearchResult = await queryWebSearch(parsedArgs.query);
      debug(`[Tool] ${name} completed, result length: ${webSearchResult.length} chars`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        name: "query_web_search",
        content: webSearchResult,
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
  const tools = [duckDuckGoTool, weatherTool, webSearchTool];
  let totalDuration = 0;
  let currentMessages: OllamaMessage[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  const maxIterations = 10; // Prevent infinite loops
  let iterations = 0;
  const allToolCalls: any[] = []; // Collect all tool calls across iterations

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

    debug(
      `[Ollama] Response received (${iterationDuration}ms), tool_calls: ${result.message.tool_calls?.length || 0}`
    );

    // If the model made tool calls, execute them and continue the conversation
    if (result.message.tool_calls && result.message.tool_calls.length > 0) {
      debug(
        `[Ollama] Tool calls detected:`,
        result.message.tool_calls.map((tc: any) => ({
          name: tc.function.name,
          id: tc.id,
        }))
      );

      // Collect tool calls for the final response
      allToolCalls.push(...result.message.tool_calls);

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

    debug(
      `[Ollama] Final response (${generationTimeMs}ms total, ${iterations} iteration${iterations !== 1 ? "s" : ""}), content length: ${content.length} chars`
    );

    return {
      content,
      generationTimeMs,
      toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    };
  }

  // If we hit max iterations, force a final response without tools
  debug(`[Ollama] Max iterations reached (${maxIterations}), getting final response...`);

  // Add a system message to force a text response
  const finalMessages: OllamaMessage[] = [
    ...currentMessages,
    {
      role: "system",
      content:
        "You have reached the maximum number of tool call iterations. Please provide a final answer based on the information you have gathered so far. Do not make any more tool calls.",
    },
  ];

  const lastResult = await ollama.chat({
    model,
    messages: finalMessages,
    // Don't pass tools to force a text-only response
  });
  totalDuration += lastResult.total_duration;
  let content = lastResult.message.content || "";

  // If content is still empty, provide a fallback message
  if (!content || content.trim().length === 0) {
    content =
      "I've gathered information from multiple sources, but I'm unable to provide a complete answer at this time. The search results may not have contained the specific information you're looking for. Please try rephrasing your question or providing more specific details.";
    debug(`[Ollama] Final response was empty, using fallback message`);
  }

  const generationTimeMs = Math.round(totalDuration / 1_000_000);

  debug(
    `[Ollama] Final response after max iterations (${generationTimeMs}ms total, ${iterations} iterations), content length: ${content.length} chars`
  );

  return {
    content,
    generationTimeMs,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
  };
}

