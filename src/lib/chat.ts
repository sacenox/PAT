import { debug } from "@/src/lib/debug";
import { createMessage } from "@/src/lib/messages";
import {
  duckDuckGoTool,
  executeToolCall,
  fetchPageTool,
  weatherTool,
  webSearchTool,
} from "@/src/lib/tools";
import { asc, eq } from "drizzle-orm";
import ollama, { type Tool } from "ollama";
import { db } from "./db";
import { messages, threads } from "./db/schema";

export async function generateResponse(threadId: number) {
  if (!threadId) {
    throw new Error("Thread ID is required");
  }

  // Get the thread:
  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (thread.length === 0) {
    throw new Error("Thread not found");
  }

  // Get all of the messages for this thread:
  const messagesList = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  if (messagesList.length === 0) {
    throw new Error("No messages found for this thread");
  }

  const tools: Tool[] = [duckDuckGoTool, weatherTool, fetchPageTool, webSearchTool];
  const chatMessages = messagesList.map((message) => ({
    role: message.role,
    content: message.content,
  }));
  let toolCallsExist = true;
  let errors = [];

  // Repeatedly generate model responses until no tool calls remain
  while (toolCallsExist) {
    // Check if we have errors from tool calls.
    errors = chatMessages.filter(
      (message) => message.role === "tool" && message.content.includes("Error:")
    );

    const response = await ollama.chat({
      model: thread[0].model,
      messages: chatMessages,
      tools: errors.length > 0 ? undefined : tools, // If we have errors, force an answer with no tool calls.
      think: true,
    });

    if (response.message.thinking) {
      debug("Thinking:", response.message.thinking);
    }

    if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
      for (const toolCall of response.message.tool_calls) {
        try {
          const toolResponse = await executeToolCall(toolCall);
          await createMessage(`${toolCall.function.name}: ${toolResponse}`, "tool", threadId);
          chatMessages.push({
            role: "tool",
            content: toolResponse,
          });
        } catch (error) {
          const content = `${toolCall.function.name}: Error: ${error instanceof Error ? error.message : "Unknown error"}`;
          createMessage(content, "tool", threadId);
          chatMessages.push({
            role: "tool",
            content: content,
          });

          debug(content);
        }
      }
    } else {
      toolCallsExist = false;
      // insert the final response into the thread:
      await createMessage(response.message.content, "assistant", threadId);
    }
  }
}
