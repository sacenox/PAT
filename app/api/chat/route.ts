import { NextResponse } from "next/server";
import { fetchOllamaResponse, type OllamaMessageInput } from "@/src/lib/ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST(request: Request) {
  const { message, threadId } = await request.json();

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  try {
    // 1. Fetch previous messages from thread
    const previousMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, parseInt(threadId)))
      .orderBy(asc(messages.createdAt));

    // 2. Store user message
    await db.insert(messages).values({
      threadId: parseInt(threadId),
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    // 3. Build messages array for Ollama
    const ollamaMessages: OllamaMessageInput[] = previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Add the new user message
    ollamaMessages.push({
      role: "user",
      content: message,
    });

    // 4. Get assistant response
    const {
      content: answer,
      generationTimeMs,
      toolCalls,
    } = await fetchOllamaResponse(ollamaMessages);

    // 5. Store assistant message with generation time and tool calls
    await db.insert(messages).values({
      threadId: parseInt(threadId),
      role: "assistant",
      content: answer,
      createdAt: new Date(),
      generationTimeMs,
      toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
    });

    // 6. Update thread's updatedAt timestamp
    await db
      .update(threads)
      .set({ updatedAt: new Date() })
      .where(eq(threads.id, parseInt(threadId)));

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ answer: "Sorry, something went wrong." }, { status: 500 });
  }
}
