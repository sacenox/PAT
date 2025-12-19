"use client";

import type { Message } from "@/src/lib/db/schema";
import { formatTimestamp } from "@/src/lib/format-timestamp";

type MessageFooterProps = {
  message: Message;
  label: string;
  align?: "left" | "center" | "right";
  textColor?: string;
  children?: React.ReactNode;
};

/**
 * Shared footer component for message components that displays timestamp and optional metadata.
 * @param message - The message object containing the timestamp
 * @param label - The label text to display before the timestamp
 * @param align - Text alignment (default: "left")
 * @param textColor - Custom text color classes (default: "text-neutral-600 dark:text-neutral-400")
 * @param children - Optional additional content to display after the timestamp
 */
export default function MessageFooter({
  message,
  label,
  align = "left",
  textColor = "text-neutral-600 dark:text-neutral-400",
  children,
}: MessageFooterProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div className={`mt-4 text-xs ${alignClass} ${textColor}`}>
      {label} {formatTimestamp(message.createdAt)}
      {children}
    </div>
  );
}
