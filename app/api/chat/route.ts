import { NextResponse } from "next/server";
import { fetchOllamaResponse, type OllamaMessageInput } from "@/src/lib/ollama";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST(request: Request) {
  const { message, threadId } = await request.json();
  const signal = request.signal;

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  try {
    // 1. Fetch thread to get its model and maxPromptLength settings
    // These thread-specific settings override any global settings
    const thread = await db
      .select()
      .from(threads)
      .where(eq(threads.id, parseInt(threadId)))
      .limit(1);
    if (thread.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    // Use thread-specific model (stored in thread table)
    const threadModel = thread[0].model || "gpt-oss";
    // Use thread-specific maxPromptLength (stored in thread table, can be null, 1024, or 4096)
    // Type assertion ensures compatibility with fetchOllamaResponse which expects "none" | 1024 | 4096 | null
    // Note: null from database means "none" (no limit), which fetchOllamaResponse handles correctly
    const threadMaxPromptLength: "none" | 1024 | 4096 | null =
      thread[0].maxPromptLength === null ? null : (thread[0].maxPromptLength as 1024 | 4096);

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
        // Track if controller is closed to avoid double-close
        let isControllerClosed = false;
        const safeClose = () => {
          if (!isControllerClosed) {
            isControllerClosed = true;
            try {
              controller.close();
            } catch (e) {
              // Controller may already be closed, ignore
            }
          }
        };

        try {

          // Check if already aborted
          if (signal.aborted) {
            safeClose();
            return;
          }

          const onChunk = (chunk: { content?: string; thinking?: string; toolCalls?: any[] }) => {
            // Check abort signal before each chunk
            if (signal.aborted || isControllerClosed) {
              return;
            }

            try {
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
            } catch (e) {
              // Controller may be closed, ignore
            }
          };

          // Set up abort handler
          const abortHandler = () => {
            if (!isControllerClosed) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "error", error: "Generation stopped" })}\n\n`
                  )
                );
              } catch (e) {
                // Controller may be closed, ignore
              }
              safeClose();
            }
          };
          signal.addEventListener("abort", abortHandler);

          let generationTimeMs: number | undefined;
          let toolCalls: any[] | undefined;

          try {
            const result = await fetchOllamaResponse(
              ollamaMessages,
              onChunk,
              threadModel,
              signal,
              threadMaxPromptLength
            );
            generationTimeMs = result.generationTimeMs;
            toolCalls = result.toolCalls;
          } catch (error) {
            // If aborted, don't throw - just close
            if (signal.aborted || (error instanceof Error && error.message === "Request aborted")) {
              safeClose();
              return;
            }
            throw error;
          } finally {
            signal.removeEventListener("abort", abortHandler);
          }

          // Check if aborted before saving
          if (signal.aborted) {
            // Save partial content if any was generated
            if (accumulatedContent) {
              await db.insert(messages).values({
                threadId: parseInt(threadId),
                role: "assistant",
                content: accumulatedContent,
                model: threadModel,
                maxPromptLength: threadMaxPromptLength, // null means "none" (no limit), otherwise 1024 or 4096
                createdAt: new Date(),
                generationTimeMs: null,
                toolCalls: allToolCalls.length > 0 ? JSON.stringify(allToolCalls) : null,
              });
              await db
                .update(threads)
                .set({ updatedAt: new Date() })
                .where(eq(threads.id, parseInt(threadId)));
              
              // Send done message with metadata for aborted generation
              if (!isControllerClosed) {
                try {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: "done", 
                        answer: accumulatedContent,
                        model: threadModel,
                        maxPromptLength: threadMaxPromptLength
                      })}\n\n`
                    )
                  );
                } catch (e) {
                  // Controller may be closed, ignore
                }
              }
            }
            safeClose();
            return;
          }

          // 6. Store assistant message with model, maxPromptLength, generation time and tool calls
          await db.insert(messages).values({
            threadId: parseInt(threadId),
            role: "assistant",
            content: accumulatedContent,
            model: threadModel,
            maxPromptLength: threadMaxPromptLength, // null means "none" (no limit), otherwise 1024 or 4096
            createdAt: new Date(),
            generationTimeMs,
            toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
          });

          // 7. Update thread's updatedAt timestamp
          await db
            .update(threads)
            .set({ updatedAt: new Date() })
            .where(eq(threads.id, parseInt(threadId)));

          // Send final message with metadata
          if (!isControllerClosed) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ 
                    type: "done", 
                    answer: accumulatedContent,
                    model: threadModel,
                    maxPromptLength: threadMaxPromptLength
                  })}\n\n`
                )
              );
            } catch (e) {
              // Controller may be closed, ignore
            }
            safeClose();
          }
        } catch (error) {
          console.error("Chat API error", error);
          if (!isControllerClosed) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", error: "Sorry, something went wrong." })}\n\n`
                )
              );
            } catch (e) {
              // Controller may be closed, ignore
            }
            safeClose();
          }
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
