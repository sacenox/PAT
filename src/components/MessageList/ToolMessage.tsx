"use client";

import type { Message } from "@/src/lib/db/schema";
import { formatTimestamp } from "@/src/lib/format-timestamp";

type ToolMessageProps = {
  message: Message;
};

export default function ToolMessage({ message }: ToolMessageProps) {
  return (
    <div className="mx-auto w-1/2 min-w-64 rounded-lg bg-neutral-100 p-2 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500">
      <div>{message.content}</div>
      <div className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-500">
        Tool message • {formatTimestamp(message.createdAt)}
      </div>
    </div>
  );
}
