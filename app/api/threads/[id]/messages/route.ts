import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { messages } from "@/src/lib/db/schema";
import { eq, asc, and, notInArray } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const threadId = parseInt(id);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const messagesList = await db
      .select()
      .from(messages)
      .where(and(eq(messages.threadId, threadId), notInArray(messages.role, ["system", "tool"])))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: messagesList });
  } catch {
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
