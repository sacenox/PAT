"use client";

import type { Thread } from "@/src/types";

type SidebarProps = {
  threads: Thread[];
  currentThreadId: number | null;
  themeMode: "device" | "dark" | "light";
  onCreateNewThread: () => Promise<void>;
  onThreadSelect: (threadId: number) => void;
  onThemeChange: (mode: "device" | "dark" | "light") => void;
};

export default function Sidebar({
  threads,
  currentThreadId,
  themeMode,
  onCreateNewThread,
  onThreadSelect,
  onThemeChange,
}: SidebarProps) {
  return (
    <div className="w-64 bg-neutral-200 p-1 dark:bg-neutral-900">
      <div className="flex flex-col gap-2 p-4">
        <button
          onClick={() => onCreateNewThread()}
          className="bg-green-900 px-1 py-1 text-neutral-100 hover:bg-green-800 dark:bg-green-500 dark:text-neutral-900 dark:hover:bg-green-600"
        >
          New Thread
        </button>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Threads</label>
          <select
            value={currentThreadId || ""}
            onChange={(e) => {
              const threadId = e.target.value ? parseInt(e.target.value) : null;
              if (threadId) {
                onThreadSelect(threadId);
              }
            }}
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
          >
            <option value="">Select a thread...</option>
            {threads.map((thread) => (
              <option key={thread.id} value={thread.id}>
                {thread.title || `Thread ${thread.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Theme</label>
          <select
            value={themeMode}
            onChange={(e) => onThemeChange(e.target.value as "device" | "dark" | "light")}
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
          >
            <option value="device">Device</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
    </div>
  );
}

