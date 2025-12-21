import { db } from "@/src/lib/db";
import { messages } from "@/src/lib/db/schema";

export async function createMessage(
  content: string,
  role: "user" | "assistant" | "system" | "tool",
  threadId: number
) {
  await db.insert(messages).values({
    threadId,
    role,
    content,
    createdAt: new Date(),
  });
}
