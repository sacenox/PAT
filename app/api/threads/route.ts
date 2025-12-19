import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads, messages } from "@/src/lib/db/schema";
import { desc, count } from "drizzle-orm";
import { generateSystemPrompt } from "@/src/lib/ollama/chat/system-prompt";
import { debug } from "@/src/lib/debug";

export async function POST(request: Request) {
  try {
    const { title, model, maxPromptLength, userPrompt, time, timezone } = await request.json();

    // Validate required parameters
    if (!model || typeof model !== "string") {
      return NextResponse.json({ error: "model is required" }, { status: 400 });
    }
    if (maxPromptLength === undefined) {
      return NextResponse.json({ error: "maxPromptLength is required" }, { status: 400 });
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
    const systemMessage = await db
      .insert(messages)
      .values({
        threadId,
        role: "system",
        content: systemPrompt,
        createdAt: new Date(),
      })
      .returning({ id: messages.id, content: messages.content, createdAt: messages.createdAt });

    return NextResponse.json({
      thread: newThread[0],
      systemMessage: systemMessage[0],
    });
  } catch (err) {
    debug(
      `[Threads API] Error creating thread:`,
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const threadsList = await db
      .select()
      .from(threads)
      .orderBy(desc(threads.updatedAt))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db.select({ count: count() }).from(threads);
    const totalCount = totalCountResult[0]?.count || 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({ threads: threadsList, hasMore, totalCount });
  } catch (err) {
    debug(
      `[Threads API] Error fetching threads:`,
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json({ error: "Failed to get threads" }, { status: 500 });
  }
}
