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
    <div className="min-w-0 max-w-5xl mx-auto">
      <div className="p-8 bg-neutral-200 dark:bg-neutral-900 prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {`# Welcome to PAT 👋

**PAT** (Personal Assistant Thing) is your personal assistant. Start typing below to start new a conversation thread or pick a previous conversation thread from the sidebar.

---

${timeDisplay ? `*Current time: ${timeDisplay}*` : ""}  
*${threadCount} ${threadCount === 1 ? "thread" : "threads"} created*`}
        </ReactMarkdown>
      </div>
    </div>
  );
}

