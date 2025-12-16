/* personal-assistant-thing/src/lib/ollama.ts */
// Wrapper using the official Ollama npm package.

import ollama from "ollama";

export interface OllamaMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
}

/**
 * Sends messages to the Ollama model using the chat API and returns the generated response.
 *
 * @param messages - Array of messages in the conversation history.
 * @param model - The Ollama model to use. Defaults to 'gpt-oss'.
 * @returns Object containing the response content and generation time in milliseconds.
 * @throws If the request fails.
 */
export async function fetchOllamaResponse(
  messages: OllamaMessage[],
  model = "gpt-oss"
): Promise<OllamaResponse> {
  const result = await ollama.chat({ model, messages });
  // The official package returns an object with a `message.content` field and `total_duration` in nanoseconds.
  const content = result.message.content;
  const generationTimeMs = Math.round(result.total_duration / 1_000_000); // Convert nanoseconds to milliseconds
  return { content, generationTimeMs };
}
