/* personal-assistant-thing/src/lib/ollama/index.ts */
// Wrapper using the official Ollama npm package.

import ollama from "ollama";
import { debug } from "../debug";
import { duckDuckGoTool, queryDuckDuckGo } from "./duckduckgo";
import { queryWeather, weatherTool } from "./weather";
import { queryWebSearch, webSearchTool } from "./websearch";

// Use types compatible with ollama package - use any to work around strict typing
type OllamaMessage = any;

export interface OllamaMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: string; // Optional JSON string of tool calls (from database)
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
  toolCalls?: any[]; // Array of tool calls made during the conversation
}

export interface OllamaChunk {
  content?: string;
  thinking?: string;
  toolCalls?: any[];
}

/**
 * Executes a tool call and returns the result.
 *
 * @param toolCall - The tool call from Ollama.
 * @returns The tool response with the execution result.
 */
async function executeToolCall(toolCall: {
  id?: string;
  type?: "function";
  function: {
    name: string;
    arguments: string | { [key: string]: any };
  };
}): Promise<OllamaMessage> {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

  debug(`[Tool] Executing: ${name}`, parsedArgs);

  let result: string;
  switch (name) {
    case "query_duckduckgo":
      if (!parsedArgs.query || typeof parsedArgs.query !== "string") {
        result = `Error: Missing or invalid "query" parameter for query_duckduckgo`;
      } else {
        result = await queryDuckDuckGo(parsedArgs.query);
      }
      break;
    case "query_weather":
      if (!parsedArgs.location || typeof parsedArgs.location !== "string") {
        result = `Error: Missing or invalid "location" parameter for query_weather`;
      } else {
        result = await queryWeather(parsedArgs.location);
      }
      break;
    case "query_web_search":
      if (!parsedArgs.query || typeof parsedArgs.query !== "string") {
        result = `Error: Missing or invalid "query" parameter for query_web_search`;
      } else {
        result = await queryWebSearch(parsedArgs.query);
      }
      break;
    default:
      debug(`[Tool] Unknown tool: ${name}`);
      result = `Error: Unknown tool "${name}"`;
  }

  debug(`[Tool] ${name} completed, result length: ${result.length} chars`);
  return {
    role: "tool",
    tool_name: name,
    content: result,
  };
}

/**
 * Sends messages to the Ollama model using the chat API and returns the generated response.
 * Supports tool calling with an agent loop - if the model requests tools, they are executed
 * and the results are sent back to the model until a final response is generated.
 * Uses streaming to process responses incrementally and can stream chunks to the UI.
 *
 * @param messages - Array of messages in the conversation history.
 * @param onChunk - Optional callback function to receive streaming chunks (content, thinking, toolCalls).
 * @param model - The Ollama model to use. Defaults to 'gpt-oss'.
 * @param signal - Optional AbortSignal to cancel the request.
 * @param maxPromptLength - Optional maximum prompt length in tokens. Can be "none", 1024, or 4096.
 * @returns Object containing the response content and generation time in milliseconds.
 * @throws If the request fails.
 */
export async function fetchOllamaResponse(
  messages: OllamaMessageInput[],
  onChunk?: (chunk: OllamaChunk) => void,
  model = "gpt-oss",
  signal?: AbortSignal,
  maxPromptLength?: "none" | 1024 | 4096 | null
): Promise<OllamaResponse> {
  const tools = [duckDuckGoTool, weatherTool, webSearchTool];
  let totalDuration = 0;
  let currentMessages: OllamaMessage[] = messages.map((msg) => {
    const message: any = {
      role: msg.role,
      content: msg.content,
    };
    // Include tool_calls if they exist (from database)
    if (msg.toolCalls) {
      try {
        message.tool_calls = JSON.parse(msg.toolCalls);
      } catch {
        // If parsing fails, ignore tool_calls
      }
    }
    return message;
  });
  const allToolCalls: any[] = [];

  // Build options object with num_ctx if maxPromptLength is set
  const options: any = {};
  if (maxPromptLength && maxPromptLength !== "none") {
    options.num_ctx = maxPromptLength;
  }

  debug(
    `[Ollama] Starting chat with model: ${model}, messages: ${messages.length}, maxPromptLength: ${maxPromptLength || "none"}`
  );

  // Agent loop: Keep iterating until the model stops requesting tools
  while (true) {
    // Check if aborted before starting new iteration
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }

    const stream = await ollama.chat({
      model,
      messages: currentMessages,
      tools,
      stream: true,
      options: Object.keys(options).length > 0 ? options : undefined,
    });

    let content = "";
    let thinking = "";
    const toolCalls: any[] = [];
    let iterationDuration = 0;

    // Accumulate partial fields from streaming chunks
    for await (const chunk of stream) {
      // Check abort signal during streaming
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }
      if (chunk.total_duration) {
        iterationDuration = chunk.total_duration;
      }

      if (chunk.message?.thinking) {
        thinking += chunk.message.thinking;
        onChunk?.({ thinking: chunk.message.thinking });
      }

      if (chunk.message?.content) {
        content += chunk.message.content;
        onChunk?.({ content: chunk.message.content });
      }

      // Accumulate tool calls from chunks
      if (chunk.message?.tool_calls?.length) {
        for (const toolCall of chunk.message.tool_calls) {
          // If tool call has an ID, check if we already have it
          const toolCallAny = toolCall as any;
          if (toolCallAny.id) {
            const existingIndex = toolCalls.findIndex((tc: any) => tc.id === toolCallAny.id);
            if (existingIndex >= 0) {
              toolCalls[existingIndex] = toolCall;
            } else {
              toolCalls.push(toolCall);
            }
          } else {
            toolCalls.push(toolCall);
          }
        }
        onChunk?.({ toolCalls: chunk.message.tool_calls });
      }
    }

    totalDuration += iterationDuration;
    const iterationDurationMs = Math.round(iterationDuration / 1_000_000);

    debug(`[Ollama] Response received (${iterationDurationMs}ms), tool_calls: ${toolCalls.length}`);

    // Append accumulated fields to messages
    if (thinking || content || toolCalls.length) {
      currentMessages.push({
        role: "assistant",
        thinking: thinking || undefined,
        content: content || "",
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    }

    // Check if aborted before processing tool calls
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }

    // If no tool calls, break the loop and return the final response
    if (!toolCalls.length) {
      const generationTimeMs = Math.round(totalDuration / 1_000_000);

      debug(
        `[Ollama] Final response (${generationTimeMs}ms total), content length: ${content.length} chars`
      );

      return {
        content,
        generationTimeMs,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      };
    }

    // Execute tool calls and add results to messages
    debug(
      `[Ollama] Tool calls detected:`,
      toolCalls.map((tc: any) => ({
        name: tc.function.name,
        id: tc.id,
      }))
    );

    allToolCalls.push(...toolCalls);

    for (const toolCall of toolCalls) {
      const toolResponse = await executeToolCall(toolCall);
      currentMessages.push(toolResponse);
    }

    debug(`[Ollama] Tool responses received, continuing conversation...`);
  }
}
