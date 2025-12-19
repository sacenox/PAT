"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "@/src/lib/db/schema";
import { formatTimestamp } from "@/src/lib/format-timestamp";
import {
  formatGenerationTime,
  formatToolCalls,
  formatPromptSize,
} from "@/src/lib/format-message-metadata";
import "../../../app/highlight-theme.css";

type AssistantMessageProps = {
  message: Message;
};

export default function AssistantMessage({ message }: AssistantMessageProps) {
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
