import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { messages } from "@/src/lib/db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import { debug } from "@/src/lib/debug";
import { createMessage } from "@/src/lib/messages";
import { generateResponse } from "@/src/lib/chat";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let threadId: number | null = null;
  try {
    const { id } = await params;
    threadId = parseInt(id);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const url = new URL(request.url);
    const optionalRolesParam = url.searchParams.get("optional_roles");

    const allowedRoles: string[] = ["user", "assistant"];

    if (optionalRolesParam) {
      const optionalRoles = optionalRolesParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const validOptionalRoles = optionalRoles.filter((r) => ["system", "tool"].includes(r));
      allowedRoles.push(...validOptionalRoles);
    }

    const messagesList = await db
      .select()
      .from(messages)
      .where(and(eq(messages.threadId, threadId), inArray(messages.role, allowedRoles)))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: messagesList });
  } catch (err) {
    debug(
      `[Messages API] Error fetching messages for thread ${threadId ?? "unknown"}:`,
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let threadId: number | null = null;
  try {
    const { id } = await params;
    threadId = parseInt(id);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const body = await request.json();
    const { message } = body;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    await createMessage(message, "user", threadId);

    // Generate a response from the model.
    await generateResponse(threadId);

    return NextResponse.json({ message: message });
  } catch (err) {
    debug(
      `[Messages API] Error creating message for thread ${threadId ?? "unknown"}:`,
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
