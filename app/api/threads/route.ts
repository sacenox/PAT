import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads, messages } from "@/src/lib/db/schema";
import { desc, count } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { title, model } = await request.json();
    const newThread = await db
      .insert(threads)
      .values({
        title: title || "New Thread",
        model: model || "gpt-oss",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const threadId = newThread[0].id;

    // Insert system message with guidelines
    await db.insert(messages).values({
      threadId,
      role: "system",
      content: `You are PAT, a helpful assistant. Please follow these guidelines:
- Tool calls should not be used more than once per user request
- Use simple and concise language
- Reply with markdown whenever possible
- When asked for code or text return it in a markdown code block`,
      createdAt: new Date(),
    });

    return NextResponse.json({ thread: newThread[0] });
  } catch (error) {
    console.error("Create thread error", error);
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
  } catch (error) {
    console.error("Get threads error", error);
    return NextResponse.json({ error: "Failed to get threads" }, { status: 500 });
  }
}
