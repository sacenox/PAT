import { generateResponse } from "@/src/lib/chat";
import { db } from "@/src/lib/db";
import { threads } from "@/src/lib/db/schema";
import { createMessage } from "@/src/lib/messages";
import ollama from "ollama";

export async function generateTitle(model: string, message: string): Promise<string | null> {
  const response = await ollama.generate({
    model: model,
    prompt: `Create a concise summary of the following message: "${message}. Return only alphanumeric characters and spaces."`,
  });

  return response.response || message.substring(0, 100);
}

export function generateSystemPrompt(options: {
  time?: string;
  timezone?: string;
  userPrompt?: string | null;
}): string {
  const { time, timezone, userPrompt } = options;

  // Build system prompt with location and time if available
  let systemPrompt = `**Purpose:** Assist the user with their questions and tasks. Don't lie, don't make up information, don't make assumptions.
**Format:** Reply with markdown whenever possible. When asked for code or text return it in a markdown code block.
**Style and tone:** Use a friendly, professional, and helpful tone. Be concise and to the point. Avoid repeating yourself. Avoid using emojis.
**Context:** You are PAT, a helpful personal assistant. Bellow you can see the contextual information for the conversation, like time and location of the user. Use this information to help the user.`;

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
        systemPrompt += `**User's current time:** ${formattedTime}\n`;
      } catch {
        // Fallback to ISO string if timezone formatting fails
        systemPrompt += `**User's current time:** ${validTime}\n`;
      }
    } else if (validTime) {
      systemPrompt += `**User's current time:** ${validTime}\n`;
    }
    if (validTimezone) {
      // Extract city name, take everything after the / and replace underscores.
      const timezoneCity = validTimezone.split("/").slice(1).join("/").replace(/_/g, " ").trim();
      systemPrompt += `**User's location:** ${timezoneCity}`;
    }
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    systemPrompt += "\n\n";
    systemPrompt += `**User added information:**:\n${userPrompt.trim()}`;
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
  let title = await generateTitle(model, userMessage);
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
