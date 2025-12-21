import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads } from "@/src/lib/db/schema";
import { desc, count } from "drizzle-orm";
import { debug } from "@/src/lib/debug";
import { createThread } from "@/src/lib/threads";

export async function POST(request: Request) {
  try {
    const { userMessage, model, maxPromptLength, userPrompt, time, timezone } =
      await request.json();

    if (!model || !userMessage) {
      return NextResponse.json({ error: "Model and user message are required" }, { status: 400 });
    }

    const thread = await createThread(
      userMessage,
      model,
      maxPromptLength,
      userPrompt,
      time,
      timezone
    );
    return NextResponse.json({ thread });
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
