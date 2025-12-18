import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { messages } from "@/src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { debug } from "@/src/lib/debug";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const threadId = parseInt(id);
    const msgId = parseInt(messageId);

    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }
    if (isNaN(msgId)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    // Delete the message (only if it belongs to the specified thread)
    const deletedMessage = await db
      .delete(messages)
      .where(and(eq(messages.id, msgId), eq(messages.threadId, threadId)))
      .returning();

    if (deletedMessage.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    debug(`[API] Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
