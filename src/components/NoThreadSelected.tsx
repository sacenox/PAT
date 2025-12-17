"use client";

import { useState, useEffect } from "react";

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
    <div className="mx-auto min-w-0 max-w-5xl">
      <div className="flex flex-col gap-4 bg-neutral-200 p-8 dark:bg-neutral-900">
        <h1 className="text-4xl font-bold">Hello, I'm PAT 👋</h1>
        <p>
          <strong>PAT</strong> (Personal Assistant Thing) is your personal assistant. Start typing
          below to start new a conversation thread or pick a previous conversation thread from the
          sidebar.
        </p>
        <hr className="border-neutral-300 dark:border-neutral-700" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {timeDisplay && <><em>Current time: {timeDisplay}</em><br /></>}
          <em>
            {threadCount} {threadCount === 1 ? "thread" : "threads"} created
          </em>
        </p>
      </div>
    </div>
  );
}
