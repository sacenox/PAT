/* personal-assistant-thing/src/lib/ollama/title.ts */
// Title generation utility for threads

import ollama from "ollama";
import { debug } from "@/src/lib/debug";

/**
 * Generates a concise title for a conversation based on message contents.
 * @param model - The Ollama model to use for generation.
 * @param messageContents - List of message content strings to generate a title from.
 * @returns The generated title, or null if generation fails.
 */
export async function generateTitle(
  model: string,
  messageContents: string[]
): Promise<string | null> {
  if (!model || !model.trim()) {
    debug("[Title] Model is not set");
    return null;
  }

  if (!messageContents || messageContents.length === 0) {
    debug("[Title] Message contents list is empty");
    return null;
  }

  // Use the first non-empty message content for title generation
  const firstMessage = messageContents.find((msg) => msg && msg.trim());
  if (!firstMessage || !firstMessage.trim()) {
    debug("[Title] No valid message content found");
    return null;
  }

  try {
    // Generate the prompt internally
    const titlePrompt = `Generate a concise title (maximum 5 words) for a conversation. Return only plain text, no markdown formatting, no quotes, no asterisks, no special characters: "${firstMessage.substring(0, 200)}"`;

    const response = await ollama.generate({
      model,
      prompt: titlePrompt,
      options: {
        num_predict: 20,
        temperature: 0.7,
        stop: ["\n", "*", "#", "`", "[", "]", "(", ")", "{", "}"],
      },
    });

    if (!response.response) {
      debug("[Title] No response from Ollama");
      return null;
    }

    // Clean up markdown characters and quotes
    const generatedTitle = response.response
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[*#`\[\](){}]/g, "")
      .replace(/^#+\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .trim();

    if (!generatedTitle) {
      debug("[Title] Generated title is empty after cleanup");
      return null;
    }

    return generatedTitle;
  } catch (err) {
    debug(`[Title] Error:`, err instanceof Error ? err.message : "Unknown error");
    return null;
  }
}

