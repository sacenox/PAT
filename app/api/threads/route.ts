import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads } from "@/src/lib/db/schema";
import { desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const newThread = await db
      .insert(threads)
      .values({
        title: title || "New Thread",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ thread: newThread[0] });
  } catch (error) {
    console.error("Create thread error", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const threadsList = await db
      .select()
      .from(threads)
      .orderBy(desc(threads.updatedAt))
      .limit(10);

    return NextResponse.json({ threads: threadsList });
  } catch (error) {
    console.error("Get threads error", error);
    return NextResponse.json({ error: "Failed to get threads" }, { status: 500 });
  }
}

