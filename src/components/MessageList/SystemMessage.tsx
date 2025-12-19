"use client";

import type { Message } from "@/src/lib/db/schema";

type SystemMessageProps = {
  message: Message;
};

export default function SystemMessage({ message }: SystemMessageProps) {
  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  return (
    <div className="mx-auto w-1/2 min-w-64 rounded-lg bg-neutral-100 p-2 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500">
      <div>{message.content}</div>
      <div className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-500">
        System message • {formatTimestamp(message.createdAt)}
      </div>
    </div>
  );
}

