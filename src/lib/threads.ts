import { db } from "@/src/lib/db";
import { threads } from "@/src/lib/db/schema";
import { createMessage } from "@/src/lib/messages";
import { generateResponse } from "@/src/lib/chat";
import { debug } from "@/src/lib/debug";
import ollama from "ollama";

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
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/^#+\s*/g, "") // Remove markdown headers
      .replace(/[*#`\[\](){}]/g, "") // Remove markdown formatting characters
      .trim();

    if (!generatedTitle) {
      debug("[Title] Generated title is empty after cleanup");
      return null;
    }

    return generatedTitle;
  } catch (err) {
    debug(`[Title] Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    return null;
  }
}

export function generateSystemPrompt(options: {
  time?: string;
  timezone?: string;
  userPrompt?: string | null;
}): string {
  const { time, timezone, userPrompt } = options;

  // Build system prompt with location and time if available
  let systemPrompt = `You are PAT, a helpful personal assistant. You must follow these guidelines:
    - Only repeat tool calls in case of errors
    - Use simple and concise language
    - Reply with markdown whenever possible
    - When asked for code or text return it in a markdown code block`;

  // Filter out empty strings - only use non-empty values
  const validTime = time?.trim() || undefined;
  const validTimezone = timezone?.trim() || undefined;

  if (validTime || validTimezone) {
    systemPrompt += "\n\n";
    if (validTime && validTimezone) {
      // Format time in the user's timezone
      try {
        const timeDate = new Date(validTime);
        const formattedTime = new Intl.DateTimeFormat("en-US", {
          timeZone: validTimezone,
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(timeDate);
        systemPrompt += `Current time: ${formattedTime}\n`;
      } catch {
        // Fallback to ISO string if timezone formatting fails
        systemPrompt += `Current time: ${validTime}\n`;
      }
    } else if (validTime) {
      systemPrompt += `Current time: ${validTime}\n`;
    }
    if (validTimezone) {
      // Extract city name, take everything after the / and replace underscores.
      const timezoneCity = validTimezone.split("/").slice(1).join("/").replace(/_/g, " ").trim();
      systemPrompt += `Location: ${timezoneCity}`;
    }
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    systemPrompt += "\n\n";
    systemPrompt += `Additional instructions:\n${userPrompt.trim()}`;
  }

  return systemPrompt;
}

export async function createThread(
  userMessage: string,
  model: string,
  maxPromptLength: "none" | 1024 | 4096,
  userPrompt: string,
  time: string,
  timezone: string
) {
  let title = await generateTitle(model, [userMessage]);
  if (!title) {
    title = userMessage.substring(0, 100);
  }

  const newThread = await db
    .insert(threads)
    .values({
      title: title,
      model: model,
      maxPromptLength:
        maxPromptLength === "none" || maxPromptLength === null ? null : maxPromptLength,
      userPrompt: userPrompt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const threadId = newThread[0].id;

  // Generate system prompt
  const systemPrompt = generateSystemPrompt({
    time,
    timezone,
    userPrompt: userPrompt || null,
  });

  // Insert system message with guidelines
  await createMessage(systemPrompt, "system", threadId);
  await createMessage(userMessage, "user", threadId);

  // Generate a response from the model.
  await generateResponse(threadId);

  return newThread[0];
}
