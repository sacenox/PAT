"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type NoThreadSelectedProps = {
  threadCount: number;
};

export default function NoThreadSelected({ threadCount }: NoThreadSelectedProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time only on client side to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const timeDisplay = currentTime ? formatTime(currentTime) : "";

  return (
    <div className="min-w-0">
      <div className="markdown-content p-1 bg-neutral-200 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {`# Welcome to PAT 👋

**PAT** (Personal Assistant Thing) is your personal assistant. To get started, click the **"New Thread"** button in the sidebar or start typing below to create your a conversation thread.

---

${timeDisplay ? `*Current time: ${timeDisplay}*` : ""}  
*${threadCount} ${threadCount === 1 ? "thread" : "threads"} available*`}
        </ReactMarkdown>
      </div>
    </div>
  );
}

