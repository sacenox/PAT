/* personal-assistant-thing/src/tests/lib/ollama/chat/ollama-chat.test.ts */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Message, ToolCall } from "ollama";

// Mock all dependencies first to prevent import loops
vi.mock("iovalkey", () => ({
  default: vi.fn(),
}));

vi.mock("@/src/lib/cache", () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/lib/ratelimit", () => ({
  createRateLimiter: vi.fn(() => ({
    check: vi.fn().mockResolvedValue({ allowed: true, remaining: 100 }),
    increment: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@/src/lib/ollama/tools/duckduckgo", () => ({
  duckDuckGoTool: { type: "function", function: { name: "query_duckduckgo" } },
}));

vi.mock("@/src/lib/ollama/tools/fetchpage", () => ({
  fetchPageTool: { type: "function", function: { name: "fetch_page" } },
}));

vi.mock("@/src/lib/ollama/tools/weather", () => ({
  weatherTool: { type: "function", function: { name: "query_weather" } },
}));

vi.mock("@/src/lib/ollama/tools/websearch", () => ({
  webSearchTool: { type: "function", function: { name: "query_web_search" } },
}));

vi.mock("ollama", () => ({
  default: { chat: vi.fn() },
}));

vi.mock("@/src/lib/ollama/tools/tool-runner", () => ({
  executeToolCall: vi.fn(),
}));

vi.mock("@/src/lib/ollama/chat/abort-handler", () => ({
  setupAbortHandler: vi.fn(),
}));

vi.mock("@/src/lib/debug", () => ({
  debug: vi.fn(),
}));

import ollama from "ollama";
import { executeToolCall } from "@/src/lib/ollama/tools/tool-runner";
import { setupAbortHandler } from "@/src/lib/ollama/chat/abort-handler";
import { OllamaChat } from "@/src/lib/ollama/chat/ollama-chat";

describe("OllamaChat", () => {
  const mockOllamaChatPackage = vi.mocked(ollama.chat);
  const mockExecuteToolCall = vi.mocked(executeToolCall);
  const mockSetupAbortHandler = vi.mocked(setupAbortHandler);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a mock stream
  type MockStreamChunk = { message?: Partial<Message>; total_duration?: number };
  type MockStream = AsyncIterable<MockStreamChunk> & { abort: () => void };

  function createMockStream(chunks: Array<MockStreamChunk>): MockStream {
    return {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
      abort: vi.fn(),
    };
  }

  describe("Basic chat without tools", () => {
    it("should return response content and generation time", async () => {
      const messages: Message[] = [{ role: "user", content: "Hello" }];
      const mockChunks = [
        { message: { content: "Hello" }, total_duration: 1000000 },
        { message: { content: " there" }, total_duration: 2000000 },
      ];

      mockOllamaChatPackage.mockResolvedValue(createMockStream(mockChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      const result = await OllamaChat(messages, undefined, "test-model");

      expect(result.content).toBe("Hello there");
      expect(result.generationTimeMs).toBe(2);
      expect(result.toolCalls).toBeUndefined();
    });

    it("should handle empty content", async () => {
      const messages: Message[] = [{ role: "user", content: "Test" }];
      const mockChunks = [{ message: {}, total_duration: 0 }];

      mockOllamaChatPackage.mockResolvedValue(createMockStream(mockChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      const result = await OllamaChat(messages, undefined, "test-model");

      expect(result.content).toBe("");
      expect(result.generationTimeMs).toBe(0);
    });
  });

  describe("Streaming chunks", () => {
    it("should call onChunk callback with content chunks", async () => {
      const messages: Message[] = [{ role: "user", content: "Hello" }];
      const mockChunks = [
        { message: { content: "Hello" } },
        { message: { content: " there" } },
      ];
      const onChunk = vi.fn();

      mockOllamaChatPackage.mockResolvedValue(createMockStream(mockChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      await OllamaChat(messages, onChunk, "test-model");

      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, { content: "Hello" });
      expect(onChunk).toHaveBeenNthCalledWith(2, { content: " there" });
    });
  });

  describe("Tool calling", () => {
    it("should execute tool calls and continue agent loop", async () => {
      const messages: Message[] = [{ role: "user", content: "Search for test" }];
      const toolCall: ToolCall = {
        function: {
          name: "query_web_search",
          arguments: { query: "test" },
        },
      };

      // First iteration: tool call
      const firstChunks = [
        { message: { tool_calls: [toolCall] }, total_duration: 1000000 },
      ];

      // Second iteration: final response
      const secondChunks = [
        { message: { content: "Here are the results" }, total_duration: 2000000 },
      ];

      mockOllamaChatPackage
        .mockResolvedValueOnce(createMockStream(firstChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>)
        .mockResolvedValueOnce(createMockStream(secondChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      mockExecuteToolCall.mockResolvedValue({
        role: "tool",
        tool_name: "query_web_search",
        content: "Search results for test",
      });

      const result = await OllamaChat(messages, undefined, "test-model");

      expect(result.content).toBe("Here are the results");
      expect(result.generationTimeMs).toBe(3);
      expect(result.toolCalls).toEqual([toolCall]);
      expect(mockExecuteToolCall).toHaveBeenCalledWith(toolCall);
    });
  });

  describe("Abort signal handling", () => {
    it("should throw error if aborted before starting", async () => {
      const messages: Message[] = [{ role: "user", content: "Test" }];
      const controller = new AbortController();
      controller.abort();

      await expect(OllamaChat(messages, undefined, "test-model", controller.signal)).rejects.toThrow(
        "Request aborted"
      );

      expect(mockOllamaChatPackage).not.toHaveBeenCalled();
    });

    it("should set up abort handler when signal is provided", async () => {
      const messages: Message[] = [{ role: "user", content: "Test" }];
      const signal = new AbortController().signal;
      const mockStream = createMockStream([
        { message: { content: "Response" }, total_duration: 1000000 },
      ]);
      const cleanup = vi.fn();

      mockOllamaChatPackage.mockResolvedValue(mockStream as unknown as Awaited<ReturnType<typeof ollama.chat>>);
      mockSetupAbortHandler.mockReturnValue(cleanup);

      await OllamaChat(messages, undefined, "test-model", signal);

      expect(mockSetupAbortHandler).toHaveBeenCalledWith(signal, expect.any(Function));
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe("maxPromptLength option", () => {
    it("should include num_ctx option when maxPromptLength is 1024", async () => {
      const messages: Message[] = [{ role: "user", content: "Test" }];
      const mockChunks = [{ message: { content: "Response" }, total_duration: 1000000 }];

      mockOllamaChatPackage.mockResolvedValue(createMockStream(mockChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      await OllamaChat(messages, undefined, "test-model", undefined, 1024);

      expect(mockOllamaChatPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { num_ctx: 1024 },
        })
      );
    });

    it("should not include options when maxPromptLength is 'none'", async () => {
      const messages: Message[] = [{ role: "user", content: "Test" }];
      const mockChunks = [{ message: { content: "Response" }, total_duration: 1000000 }];

      mockOllamaChatPackage.mockResolvedValue(createMockStream(mockChunks) as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      await OllamaChat(messages, undefined, "test-model", undefined, "none");

      expect(mockOllamaChatPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          options: undefined,
        })
      );
    });
  });
});

