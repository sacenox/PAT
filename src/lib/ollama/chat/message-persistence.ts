/* personal-assistant-thing/src/lib/ollama/chat/message-persistence.ts */

import { type ToolCall } from "ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MaxPromptLength } from "@/src/lib/ollama/types";

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

  await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));
}
