"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "@/src/lib/db/schema";
import "../../../app/highlight-theme.css";

type AssistantMessageProps = {
  message: Message;
};

export default function AssistantMessage({ message }: AssistantMessageProps) {
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
      const toolCounts: Record<string, number> = JSON.parse(toolCallsJson);
      if (typeof toolCounts !== "object" || toolCounts === null) return null;

      // Format as "toolName x count"
      const formatted = Object.entries(toolCounts)
        .map(([name, count]) => `${name} x ${count}`)
        .join(", ");

      return formatted || null;
    } catch {
      return null;
    }
  };

  const formatPromptSize = (maxPromptLength: number | null): string => {
    if (maxPromptLength === null) return "none";
    return `${maxPromptLength}`;
  };

  const hasContent = message.content && message.content.trim() !== "";

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      {hasContent && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {message.content}
        </ReactMarkdown>
      )}
      <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
        generated on {formatTimestamp(message.createdAt)}
        {message.model && <span className="ml-1">• model: {message.model}</span>}
        {message.maxPromptLength !== undefined && (
          <span className="ml-1">• prompt size: {formatPromptSize(message.maxPromptLength)}</span>
        )}
        {message.generationTimeMs && (
          <span className="ml-1">• in {formatGenerationTime(message.generationTimeMs)}</span>
        )}
        {formatToolCalls(message.toolCallCounts) && (
          <span className="ml-1">• tools: {formatToolCalls(message.toolCallCounts)}</span>
        )}
      </div>
    </div>
  );
}
