"use client";

import type { Message } from "@/src/lib/db/schema";
import MessageFooter from "./MessageFooter";

type ToolMessageProps = {
  message: Message;
};

export default function ToolMessage({ message }: ToolMessageProps) {
  return (
    <div className="mx-auto w-1/2 min-w-64 rounded-lg bg-neutral-100 p-2 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500">
      <div>{message.content}</div>
      <MessageFooter
        message={message}
        label="Tool message •"
        align="center"
        textColor="text-neutral-500 dark:text-neutral-500"
      />
    </div>
  );
}
