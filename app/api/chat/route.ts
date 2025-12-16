import { NextResponse } from "next/server";
import { fetchOllamaResponse } from "@/src/lib/ollama";
import { fetchDuckDuckGo } from "@/src/lib/duckduckgo";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { message, threadId } = await request.json();

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  try {
    // 1. Store user message
    const userMessage = await db
      .insert(messages)
      .values({
        threadId: parseInt(threadId),
        role: "user",
        content: message,
        createdAt: new Date(),
      })
      .returning();

    // 2. Search DuckDuckGo
    const searchResults = await fetchDuckDuckGo(message);

    console.debug("searchResults:", searchResults);

    // 3. Build prompt
    const prompt = `${message}\n\nRelevant info from DuckDuckGo: ${JSON.stringify(
      searchResults
    )}\n\nAssistant:`;

    // 4. Get assistant response
    const answer = await fetchOllamaResponse(prompt);

    // 5. Store assistant message
    await db.insert(messages).values({
      threadId: parseInt(threadId),
      role: "assistant",
      content: answer,
      createdAt: new Date(),
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
