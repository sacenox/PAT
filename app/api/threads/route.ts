import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { threads, messages } from "@/src/lib/db/schema";
import { desc, count } from "drizzle-orm";
import { getCache } from "@/src/lib/cache";

const SETTINGS_CACHE_KEY = "app_settings";

type Settings = {
  maxPromptLength: "none" | 1024 | 4096;
  selectedModel?: string;
  location?: string;
  currentTime?: string;
  timezone?: string;
};

export async function POST(request: Request) {
  try {
    const { title, model, maxPromptLength } = await request.json();
    const newThread = await db
      .insert(threads)
      .values({
        title: title,
        model: model,
        maxPromptLength:
          maxPromptLength === "none" || maxPromptLength === null ? null : maxPromptLength,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const threadId = newThread[0].id;

    // Get location, currentTime, and timezone from settings
    const settings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    const location = settings?.location;
    const currentTime = settings?.currentTime;
    const timezone = settings?.timezone;

    // Build system prompt with location and time if available
    let systemPrompt = `You are PAT, a helpful personal assistant. You must follow these guidelines:
- Only repeat tool calls in case of errors
- Use simple and concise language
- Reply with markdown whenever possible
- When asked for code or text return it in a markdown code block`;

    if (location || currentTime || timezone) {
      systemPrompt += "\n\n";
      if (currentTime && timezone) {
        // Format time in the user's timezone
        try {
          const timeDate = new Date(currentTime);
          const formattedTime = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          }).format(timeDate);
          systemPrompt += `Current time: ${formattedTime}\n`;
        } catch (error) {
          // Fallback to ISO string if timezone formatting fails
          systemPrompt += `Current time: ${currentTime}\n`;
        }
      } else if (currentTime) {
        systemPrompt += `Current time: ${currentTime}\n`;
      }
      if (location) {
        systemPrompt += `Location: ${location}`;
      }
    }

    // Insert system message with guidelines
    await db.insert(messages).values({
      threadId,
      role: "system",
      content: systemPrompt,
      createdAt: new Date(),
    });

    return NextResponse.json({ thread: newThread[0] });
  } catch {
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
  } catch {
    return NextResponse.json({ error: "Failed to get threads" }, { status: 500 });
  }
}
