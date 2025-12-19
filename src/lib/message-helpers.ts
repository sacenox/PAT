import type { Message } from "@/src/lib/db/schema";

type MessageMetadata = {
  model?: string | null;
  maxPromptLength?: number | null;
  toolCallCounts?: string | null;
};

/**
 * Creates a user message object.
 * @param message - The message content
 * @param threadId - The thread ID this message belongs to
 * @returns A Message object with role "user"
 */
export function createUserMessage(message: string, threadId: number): Message {
  return {
    id: Date.now(),
    threadId,
    role: "user",
    content: message,
    createdAt: new Date(),
    model: null,
    maxPromptLength: null,
    generationTimeMs: null,
    toolCallCounts: null,
  };
}

/**
 * Creates an assistant message object.
 * @param id - The message ID
 * @param threadId - The thread ID this message belongs to
 * @param content - The message content
 * @param metadata - Optional metadata (model, maxPromptLength, toolCallCounts)
 * @returns A Message object with role "assistant"
 */
export function createAssistantMessage(
  id: number,
  threadId: number,
  content: string,
  metadata?: MessageMetadata
): Message {
  return {
    id,
    threadId,
    role: "assistant",
    content,
    createdAt: new Date(),
    model: metadata?.model ?? null,
    maxPromptLength: metadata?.maxPromptLength ?? null,
    generationTimeMs: null,
    toolCallCounts: metadata?.toolCallCounts ?? null,
  };
}

/**
 * Creates a tool message object.
 * @param id - The message ID
 * @param threadId - The thread ID this message belongs to
 * @param content - The message content
 * @param createdAt - Optional creation date (string or Date), defaults to now
 * @returns A Message object with role "tool"
 */
export function createToolMessage(
  id: number,
  threadId: number,
  content: string,
  createdAt?: string | Date
): Message {
  return {
    id,
    threadId,
    role: "tool",
    content,
    createdAt: createdAt
      ? typeof createdAt === "string"
        ? new Date(createdAt)
        : createdAt
      : new Date(),
    model: null,
    maxPromptLength: null,
    generationTimeMs: null,
    toolCallCounts: null,
  };
}

/**
 * Creates a system message object.
 * @param id - The message ID
 * @param threadId - The thread ID this message belongs to
 * @param content - The message content
 * @param createdAt - Optional creation date (string or Date), defaults to now
 * @returns A Message object with role "system"
 */
export function createSystemMessage(
  id: number,
  threadId: number,
  content: string,
  createdAt?: string | Date
): Message {
  return {
    id,
    threadId,
    role: "system",
    content,
    createdAt: createdAt
      ? typeof createdAt === "string"
        ? new Date(createdAt)
        : createdAt
      : new Date(),
    model: null,
    maxPromptLength: null,
    generationTimeMs: null,
    toolCallCounts: null,
  };
}
