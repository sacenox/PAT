/* personal-assistant-thing/src/tests/lib/ollama/chat/assistant-response.test.ts */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Message, ToolCall } from "ollama";
import { streamAssistantResponse } from "@/src/lib/ollama/chat/assistant-response";
import { OllamaChat } from "@/src/lib/ollama/chat/ollama-chat";
import { createStreamController } from "@/src/lib/ollama/chat/stream-controller";
import { setupAbortHandler, isAbortedOrClosed } from "@/src/lib/ollama/chat/abort-handler";
import { saveAssistantMessage, extractToolCounts } from "@/src/lib/ollama/chat/message-persistence";

// Mock dependencies
vi.mock("@/src/lib/ollama/chat/ollama-chat", () => ({
  OllamaChat: vi.fn(),
}));

vi.mock("@/src/lib/ollama/chat/stream-controller", () => ({
  createStreamController: vi.fn(),
}));

vi.mock("@/src/lib/ollama/chat/abort-handler", () => ({
  setupAbortHandler: vi.fn(),
  isAbortedOrClosed: vi.fn(),
}));

vi.mock("@/src/lib/ollama/chat/message-persistence", () => ({
  saveAssistantMessage: vi.fn().mockResolvedValue(undefined),
  extractToolCounts: vi.fn(),
}));

describe("streamAssistantResponse", () => {
  const mockOllamaChat = vi.mocked(OllamaChat);
  const mockCreateStreamController = vi.mocked(createStreamController);
  const mockSetupAbortHandler = vi.mocked(setupAbortHandler);
  const mockIsAbortedOrClosed = vi.mocked(isAbortedOrClosed);
  const mockSaveAssistantMessage = vi.mocked(saveAssistantMessage);
  const mockExtractToolCounts = vi.mocked(extractToolCounts);

  const mockSafeEnqueue = vi.fn();
  const mockSafeClose = vi.fn();
  const mockIsClosed = vi.fn().mockReturnValue(false);
  const mockCleanup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateStreamController.mockReturnValue({
      safeEnqueue: mockSafeEnqueue,
      safeClose: mockSafeClose,
      isClosed: mockIsClosed,
    });
    mockSetupAbortHandler.mockReturnValue(mockCleanup);
    mockIsAbortedOrClosed.mockReturnValue(false);
    mockExtractToolCounts.mockReturnValue(null);
  });

  it("should stream content chunks and save message", async () => {
    const messages: Message[] = [{ role: "user", content: "Hello" }];
    const signal = new AbortController().signal;

    mockOllamaChat.mockImplementation(async (_, onChunk) => {
      if (onChunk) {
        onChunk({ content: "Hello" });
        onChunk({ content: " there" });
      }
      return {
        content: "Hello there",
        generationTimeMs: 100,
      };
    });

    const stream = streamAssistantResponse({
      ollamaMessages: messages,
      threadId: 1,
      threadModel: "test-model",
      threadMaxPromptLength: 1024,
      signal,
    });

    // Trigger stream start by reading
    const reader = stream.getReader();
    const readPromise = reader.read();

    // Wait for stream to process
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Cancel reader to allow stream to complete
    reader.cancel();

    try {
      await readPromise;
    } catch {
      // Ignore cancel errors
    }

    expect(mockOllamaChat).toHaveBeenCalledWith(
      messages,
      expect.any(Function),
      "test-model",
      signal,
      1024
    );
    expect(mockSaveAssistantMessage).toHaveBeenCalledWith({
      threadId: 1,
      content: "Hello there",
      model: "test-model",
      maxPromptLength: 1024,
      generationTimeMs: 100,
      toolCallCounts: null,
    });
    expect(mockSafeEnqueue).toHaveBeenCalledWith({
      type: "done",
      answer: "Hello there",
      model: "test-model",
      maxPromptLength: 1024,
      toolCallCounts: null,
    });
    expect(mockSafeClose).toHaveBeenCalled();
  });

  it("should handle tool calls", async () => {
    const messages: Message[] = [{ role: "user", content: "Search for test" }];
    const signal = new AbortController().signal;
    const toolCall: ToolCall = {
      function: {
        name: "query_web_search",
        arguments: { query: "test" },
      },
    };

    mockOllamaChat.mockImplementation(async (_, onChunk) => {
      if (onChunk) {
        onChunk({ tool_calls: [toolCall] });
        onChunk({ content: "Results" });
      }
      return {
        content: "Results",
        generationTimeMs: 200,
        toolCalls: [toolCall],
      };
    });
    mockExtractToolCounts.mockReturnValue('{"query_web_search": 1}');

    const stream = streamAssistantResponse({
      ollamaMessages: messages,
      threadId: 2,
      threadModel: "test-model",
      threadMaxPromptLength: "none",
      signal,
    });

    const reader = stream.getReader();
    const readPromise = reader.read();
    await new Promise((resolve) => setTimeout(resolve, 10));
    reader.cancel();

    try {
      await readPromise;
    } catch {
      // Ignore cancel errors
    }

    expect(mockExtractToolCounts).toHaveBeenCalledWith([toolCall]);
    expect(mockSaveAssistantMessage).toHaveBeenCalledWith({
      threadId: 2,
      content: "Results",
      model: "test-model",
      maxPromptLength: "none",
      generationTimeMs: 200,
      toolCallCounts: '{"query_web_search": 1}',
    });
  });

  it("should handle abort signal before generation", async () => {
    const messages: Message[] = [{ role: "user", content: "Test" }];
    const controller = new AbortController();
    controller.abort();

    const stream = streamAssistantResponse({
      ollamaMessages: messages,
      threadId: 1,
      threadModel: "test-model",
      threadMaxPromptLength: 1024,
      signal: controller.signal,
    });

    const reader = stream.getReader();
    const readPromise = reader.read();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 100));

    await Promise.race([readPromise, timeoutPromise]);

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockSafeClose).toHaveBeenCalled();
  });

  it("should handle abort during generation", async () => {
    const messages: Message[] = [{ role: "user", content: "Test" }];
    const controller = new AbortController();
    const signal = controller.signal;

    mockOllamaChat.mockRejectedValue(new Error("Request aborted"));

    const stream = streamAssistantResponse({
      ollamaMessages: messages,
      threadId: 1,
      threadModel: "test-model",
      threadMaxPromptLength: 1024,
      signal,
    });

    const reader = stream.getReader();
    const readPromise = reader.read();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 100));

    await Promise.race([readPromise, timeoutPromise]);

    expect(mockSafeClose).toHaveBeenCalled();
  });

  it("should handle content chunks during generation", async () => {
    const messages: Message[] = [{ role: "user", content: "Test" }];
    const signal = new AbortController().signal;

    mockOllamaChat.mockImplementation(async (_, onChunk) => {
      if (onChunk) {
        onChunk({ content: "Partial" });
        onChunk({ content: " content" });
      }
      return {
        content: "Partial content",
        generationTimeMs: 50,
      };
    });

    const stream = streamAssistantResponse({
      ollamaMessages: messages,
      threadId: 1,
      threadModel: "test-model",
      threadMaxPromptLength: 1024,
      signal,
    });

    const reader = stream.getReader();
    const readPromise = reader.read();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 100));

    await Promise.race([readPromise, timeoutPromise]);
    reader.cancel();

    expect(mockSafeEnqueue).toHaveBeenCalledWith({
      type: "content",
      content: "Partial",
    });
    expect(mockSafeEnqueue).toHaveBeenCalledWith({
      type: "content",
      content: " content",
    });
  });
});
