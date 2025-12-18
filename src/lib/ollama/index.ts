/* personal-assistant-thing/src/lib/ollama/index.ts */
// Wrapper using the official Ollama npm package.

import ollama, { type Message, type ToolCall } from "ollama";
import { debug } from "@/src/lib/debug";
import { duckDuckGoTool, queryDuckDuckGo } from "@/src/lib/ollama/duckduckgo";
import { queryWeather, weatherTool } from "@/src/lib/ollama/weather";
import { queryWebSearch, webSearchTool } from "@/src/lib/ollama/websearch";
import type { OllamaChunk, OllamaResponse, MaxPromptLength } from "@/src/lib/ollama/types";

/**
 * Executes a tool call and returns the result.
 *
 * @param toolCall - The tool call from Ollama.
 * @returns The tool response with the execution result.
 */
async function executeToolCall(toolCall: ToolCall): Promise<Message> {
  const { name, arguments: args } = toolCall.function;
  const { query } = args as { query: string };

  const tools = {
    query_web_search: queryWebSearch,
    query_weather: queryWeather,
    query_duckduckgo: queryDuckDuckGo,
  };

  let result: string;
  try {
    result = tools[name](query);
    debug(`[Tool] ${name} completed, result length: ${result.length} chars`);
  } catch (error) {
    debug("[Tool] call failed: " + error.message || "Unknown error")
    result = `Error executing tool call: ${error.message || "Unknown error"}`;
  }

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
 * @param model - The Ollama model to use..
 * @param signal - Optional AbortSignal to cancel the request.
 * @param maxPromptLength - Optional maximum prompt length in tokens. Can be "none", 1024, or 4096.
 * @returns Object containing the response content and generation time in milliseconds.
 * @throws If the request fails.
 */
export async function fetchOllamaResponse(
  messages: Message[],
  onChunk?: (chunk: OllamaChunk) => void,
  model = "",
  signal?: AbortSignal,
  maxPromptLength?: MaxPromptLength
): Promise<OllamaResponse> {
  const tools = [duckDuckGoTool, weatherTool, webSearchTool];
  let totalDuration = 0;
  const currentMessages: Message[] = messages;
  const allToolCalls: ToolCall[] = [];

  // Build options object with num_ctx if maxPromptLength is set
  const options: { num_ctx?: number } = {};
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

    // Ensure all messages have content as a string (required by ollama.chat)
    // currentMessages is already Message[], just ensure content is not empty
    const messagesForOllama: Message[] = currentMessages.map((msg) => ({
      ...msg,
      content: msg.content ?? "",
    }));

    const stream = await ollama.chat({
      model,
      messages: messagesForOllama,
      tools,
      stream: true,
      options: Object.keys(options).length > 0 ? options : undefined,
    });

    let content = "";
    let thinking = "";
    const toolCalls: ToolCall[] = [];
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
          // If tool call has an ID (present in streaming but not in type), check if we already have it
          const toolCallWithId = toolCall as ToolCall & { id?: string };
          if (toolCallWithId.id) {
            const existingIndex = toolCalls.findIndex(
              (tc: ToolCall & { id?: string }) =>
                (tc as ToolCall & { id?: string }).id === toolCallWithId.id
            );
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
      toolCalls.map((tc: ToolCall & { id?: string }) => ({
        name: tc.function.name,
        id: (tc as ToolCall & { id?: string }).id,
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
