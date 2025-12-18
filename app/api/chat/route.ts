import { NextResponse } from "next/server";
import type { MaxPromptLength } from "@/src/lib/ollama/types";
import type { Message } from "ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { streamAssistantResponse } from "@/src/lib/chat";

export async function POST(request: Request) {
  const { message, threadId: threadIdRaw } = await request.json();
  const signal = request.signal;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required " }, { status: 400 });
  }

  if (!threadIdRaw) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  const threadId: number = Number(threadIdRaw);
  if (isNaN(threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  try {
    // 1. Fetch thread to get its model and maxPromptLength settings
    // These thread-specific settings override any global settings
    const thread = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
    if (thread.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    // Use thread-specific settings (stored in thread table)
    const threadModel = thread[0].model;
    // Note: null from database means "none" (no limit), which fetchOllamaResponse handles correctly
    const threadMaxPromptLength: MaxPromptLength =
      thread[0].maxPromptLength === null ? null : (thread[0].maxPromptLength as MaxPromptLength);

    // 2. Fetch previous messages from thread
    const previousMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));

    // 3. Store user message
    await db.insert(messages).values({
      threadId: threadId,
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    // 4. Build messages array for Ollama
    // Note: tool_calls are not needed for conversation history, only stored for display
    const ollamaMessages: Message[] = previousMessages.map((msg) => ({
      role: msg.role as Message["role"],
      content: msg.content,
    }));

    // Add the new user message
    ollamaMessages.push({
      role: "user",
      content: message,
    });

    // 5. Stream assistant response
    const stream = streamAssistantResponse({
      ollamaMessages,
      threadId,
      threadModel,
      threadMaxPromptLength,
      signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ answer: "Sorry, something went wrong." }, { status: 500 });
  }
}
