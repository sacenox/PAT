"use client";

import { useRef, useEffect, useState } from "react";
import type { Message } from "@/src/lib/db/schema";

type UserMessageProps = {
  message: Message;
};

export default function UserMessage({ message }: UserMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const isScrollable = contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setShowGradient(isScrollable);
      }
    };

    checkOverflow();
    // Check on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [message.content]);

  return (
    <div className="ml-auto w-1/2 min-w-64 rounded-lg bg-neutral-200 p-2 dark:bg-neutral-800">
      <div className="relative">
        <div
          ref={contentRef}
          className="max-h-48 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {message.content}
        </div>
        {showGradient && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-200 to-transparent dark:from-neutral-800 dark:to-transparent" />
        )}
      </div>
      <div className="mt-4 text-right text-xs text-neutral-600 dark:text-neutral-400">
        sent on {formatTimestamp(message.createdAt)}
      </div>
    </div>
  );
}
