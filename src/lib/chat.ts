import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { createMessage } from "@/src/lib/messages";
import { executeToolCall, fetchPageTool, weatherTool, webSearchTool } from "@/src/lib/tools";
import { asc, eq } from "drizzle-orm";
import ollama, { type Tool, type ToolCall } from "ollama";

type MessageHistoryEntry = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  thinking?: string;
};

type MessageHistory = MessageHistoryEntry[];

export function streamResponse(
  onChunk: (enqueue: (message: MessageHistoryEntry & { done?: boolean }) => void) => void
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (message: MessageHistoryEntry & { done?: boolean }) => {
        const encoded = encoder.encode("data: " + JSON.stringify(message) + "\n\n");
        controller.enqueue(encoded);
        if (message.done) {
          controller.close();
        }
      };

      onChunk(enqueue);
    },
  });

  return stream;
}

async function agentLoop(
  model: string,
  messageHistory: MessageHistory,
  enqueue: (message: MessageHistoryEntry & { done?: boolean }) => void
) {
  const tools: Tool[] = [weatherTool, fetchPageTool, webSearchTool];
  const newMessages: MessageHistory = [];
  let maxIterations = 6;

  while (true) {
    maxIterations--;

    const stream = await ollama.chat({
      model: model,
      messages: [...messageHistory, ...newMessages],
      tools: maxIterations > 0 ? tools : undefined,
      think: true,
      stream: true,
    });

    let thinking = "";
    let content = "";
    const calls: ToolCall[] = [];

    for await (const chunk of stream) {
      if (chunk.message.thinking) {
        thinking += chunk.message.thinking;
        enqueue({ role: "assistant", content: content, thinking: thinking });
      }
      if (chunk.message.content) {
        content += chunk.message.content;
        enqueue({ role: "assistant", content: content, thinking: thinking });
      }
      if (chunk.message.tool_calls?.length) {
        calls.push(...chunk.message.tool_calls);
      }
    }

    if (content) {
      newMessages.push({ role: "assistant", content: content, thinking: thinking });
    }
    if (calls.length) {
      for (const call of calls) {
        const toolResponse = await executeToolCall(call);
        newMessages.push({ role: "tool", content: `[${call.function.name}] ${toolResponse}` });
        enqueue({ role: "tool", content: `[${call.function.name}] ${toolResponse}` });
      }
    } else {
      enqueue({
        role: "assistant",
        content: content,
        thinking: thinking,
        done: true,
      });
      break;
    }
  }

  return newMessages;
}

export async function generateResponse(
  threadId: number,
  enqueue: (message: MessageHistoryEntry) => void
) {
  if (!threadId) {
    throw new Error("Thread ID is required");
  }

  // Get the thread:
  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (thread.length === 0) {
    throw new Error("Thread not found");
  }

  // Get all of the messages for this thread:
  const messagesList = (await db
    .select({
      role: messages.role,
      content: messages.content,
      thinking: messages.thinking,
    })
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt))) as MessageHistory;

  if (messagesList.length === 0) {
    throw new Error("No messages found for this thread");
  }

  const messageHistory = await agentLoop(thread[0].model, messagesList, enqueue);

  // Update the thread with the new message history:
  for (const message of messageHistory) {
    await createMessage(message.content, message.role, threadId, message.thinking);
  }
}
