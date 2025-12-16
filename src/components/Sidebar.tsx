"use client";

import type { Thread } from "@/src/types";

type SidebarProps = {
  threads: Thread[];
  currentThreadId: number | null;
  themeMode: "device" | "dark" | "light";
  onCreateNewThread: () => void;
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
          <div className="flex flex-col gap-1">
            {threads.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                No threads yet
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread.id)}
                  className={`px-3 py-2 text-left text-sm border-2 hover:bg-neutral-300 dark:hover:bg-neutral-800 ${
                    currentThreadId === thread.id
                      ? "bg-neutral-300 dark:bg-neutral-800 border-green-900 dark:border-green-500"
                      : "bg-neutral-100 dark:bg-neutral-950 border-transparent"
                  }`}
                >
                  <div className="line-clamp-2 break-words">
                    {thread.title || `Thread ${thread.id}`}
                  </div>
                </button>
              ))
            )}
          </div>
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

