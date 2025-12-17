"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "@/src/lib/db/schema";
import "../../app/highlight-theme.css";

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({ messages }: MessageListProps) {
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    // Scroll to the start of the newly added message
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      const messageElement = messageRefs.current.get(newMessage.id);
      if (messageElement) {
        messageElement.scrollIntoView({ block: "start", behavior: "instant" });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  const formatGenerationTime = (ms: number | null): string => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatToolCalls = (toolCallsJson: string | null): string | null => {
    if (!toolCallsJson) return null;
    try {
      const toolCalls = JSON.parse(toolCallsJson);
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;

      // Count occurrences of each tool name
      const toolCounts: Record<string, number> = {};
      toolCalls.forEach((tc: any) => {
        const toolName = tc.function?.name || "unknown";
        toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
      });

      // Format as "toolName x count"
      const formatted = Object.entries(toolCounts)
        .map(([name, count]) => `${name} x ${count}`)
        .join(", ");

      return formatted;
    } catch {
      return null;
    }
  };

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          ref={(el) => {
            if (el) {
              messageRefs.current.set(msg.id, el);
            } else {
              messageRefs.current.delete(msg.id);
            }
          }}
          className="w-full min-w-0"
        >
          <div
            className={`p-2 ${
              msg.role === "assistant"
                ? "prose prose-neutral max-w-none bg-neutral-200 dark:prose-invert dark:bg-neutral-900"
                : "ml-auto w-1/2 min-w-64 bg-neutral-300 text-right dark:bg-neutral-800"
            }`}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {msg.content}
              </ReactMarkdown>
            ) : (
              <div>{msg.content}</div>
            )}
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              sent on {formatTimestamp(msg.createdAt)}
              {msg.role === "assistant" && msg.generationTimeMs && (
                <span className="ml-1">
                  • generated in {formatGenerationTime(msg.generationTimeMs)}
                </span>
              )}
              {msg.role === "assistant" && formatToolCalls(msg.toolCalls) && (
                <span className="ml-1">• tools: {formatToolCalls(msg.toolCalls)}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

