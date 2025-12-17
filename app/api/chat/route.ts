import { NextResponse } from "next/server";
import { fetchOllamaResponse, type OllamaMessageInput } from "@/src/lib/ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST(request: Request) {
  const { message, threadId } = await request.json();

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  try {
    // 1. Fetch thread to get its model
    const thread = await db
      .select()
      .from(threads)
      .where(eq(threads.id, parseInt(threadId)))
      .limit(1);
    if (thread.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    const threadModel = thread[0].model || "gpt-oss";

    // 2. Fetch previous messages from thread
    const previousMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, parseInt(threadId)))
      .orderBy(asc(messages.createdAt));

    // 3. Store user message
    await db.insert(messages).values({
      threadId: parseInt(threadId),
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    // 4. Build messages array for Ollama
    const ollamaMessages: OllamaMessageInput[] = previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    // Add the new user message
    ollamaMessages.push({
      role: "user",
      content: message,
    });

    // 5. Stream assistant response
    let accumulatedContent = "";
    let accumulatedThinking = "";
    const allToolCalls: any[] = [];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const onChunk = (chunk: { content?: string; thinking?: string; toolCalls?: any[] }) => {
            if (chunk.content) {
              accumulatedContent += chunk.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", content: chunk.content })}\n\n`
                )
              );
            }
            if (chunk.thinking) {
              accumulatedThinking += chunk.thinking;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "thinking", thinking: chunk.thinking })}\n\n`
                )
              );
            }
            if (chunk.toolCalls) {
              allToolCalls.push(...chunk.toolCalls);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "toolCalls", toolCalls: chunk.toolCalls })}\n\n`
                )
              );
            }
          };

          const { generationTimeMs, toolCalls } = await fetchOllamaResponse(
            ollamaMessages,
            onChunk,
            threadModel
          );

          // 6. Store assistant message with generation time and tool calls
          await db.insert(messages).values({
            threadId: parseInt(threadId),
            role: "assistant",
            content: accumulatedContent,
            createdAt: new Date(),
            generationTimeMs,
            toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
          });

          // 7. Update thread's updatedAt timestamp
          await db
            .update(threads)
            .set({ updatedAt: new Date() })
            .where(eq(threads.id, parseInt(threadId)));

          // Send final message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", answer: accumulatedContent })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Chat API error", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Sorry, something went wrong." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ answer: "Sorry, something went wrong." }, { status: 500 });
  }
}
