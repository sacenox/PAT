import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { debug } from "@/src/lib/debug";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let threadId: number | null = null;
  try {
    const { id } = await params;
    threadId = parseInt(id);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    // Delete the thread (messages will be cascade deleted due to foreign key constraint)
    const deletedThread = await db.delete(threads).where(eq(threads.id, threadId)).returning();

    if (deletedThread.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    debug(
      `[Threads API] Error deleting thread ${threadId ?? "unknown"}:`,
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}
