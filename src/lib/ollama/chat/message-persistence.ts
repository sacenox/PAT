/* personal-assistant-thing/src/lib/ollama/chat/message-persistence.ts */

import { type ToolCall } from "ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import type { MaxPromptLength } from "@/src/lib/ollama/types";
import { generateTitle } from "@/src/lib/ollama/title";

/**
 * Extracts tool name counts from an array of tool calls.
 * Returns a JSON string of the format: {"tool_name": count, ...}
 */
export function extractToolCounts(toolCalls: ToolCall[]): string | null {
  if (toolCalls.length === 0) return null;

  const toolCounts: Record<string, number> = {};
  for (const toolCall of toolCalls) {
    const toolName = toolCall.function.name;
    toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
  }

  return JSON.stringify(toolCounts);
}

export interface SaveMessageParams {
  threadId: number;
  content: string;
  model: string | null;
  maxPromptLength: MaxPromptLength;
  generationTimeMs: number | null;
  toolCallCounts: string | null;
}

/**
 * Saves an assistant message to the database and updates the thread's updatedAt timestamp.
 * Also generates and updates the thread title from the message history.
 */
export async function saveAssistantMessage(params: SaveMessageParams): Promise<void> {
  const { threadId, content, model, maxPromptLength, generationTimeMs, toolCallCounts } = params;

  await db.insert(messages).values({
    threadId,
    role: "assistant",
    content,
    model,
    maxPromptLength: maxPromptLength === "none" ? null : maxPromptLength,
    createdAt: new Date(),
    generationTimeMs,
    toolCallCounts,
  });

  // Fetch thread to get the model for title generation
  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  const threadModel = thread[0]?.model;

  // Always generate and update title if we have a model
  if (threadModel) {
    // Fetch user and assistant messages for the thread to generate title from message history
    const allMessages = await db
      .select({ content: messages.content })
      .from(messages)
      .where(and(eq(messages.threadId, threadId), inArray(messages.role, ["user", "assistant"])))
      .orderBy(asc(messages.createdAt));

    const messageContents = allMessages.map((msg) => msg.content);
    const generatedTitle = await generateTitle(threadModel, messageContents);

    if (generatedTitle) {
      await db
        .update(threads)
        .set({ title: generatedTitle, updatedAt: new Date() })
        .where(eq(threads.id, threadId));
    } else {
      // Still update updatedAt even if title generation failed
      await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));
    }
  } else {
    // Just update updatedAt if no model available
    await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));
  }
}
