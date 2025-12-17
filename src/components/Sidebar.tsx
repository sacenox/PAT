"use client";

import type { Thread } from "@/src/lib/db/schema";
import PlusIcon from "@/src/components/icons/PlusIcon";
import ChevronDownIcon from "@/src/components/icons/ChevronDownIcon";

type SidebarProps = {
  threads: Thread[];
  currentThreadId: number | null;
  themeMode: "device" | "dark" | "light";
  onCreateNewThread: () => void;
  onThreadSelect: (threadId: number) => void;
  onThemeChange: (mode: "device" | "dark" | "light") => void;
  onLoadMore: () => void;
  hasMoreThreads: boolean;
};

export default function Sidebar({
  threads,
  currentThreadId,
  themeMode,
  onCreateNewThread,
  onThreadSelect,
  onThemeChange,
  onLoadMore,
  hasMoreThreads,
}: SidebarProps) {
  return (
    <div className="h-full w-64 overflow-y-auto bg-neutral-200 p-1 dark:bg-neutral-900">
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Threads</label>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onCreateNewThread()}
              className="flex items-center justify-center gap-1 bg-indigo-200 px-1 py-1 text-indigo-900 hover:bg-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              New Thread
            </button>
            {threads.length === 0 ? (
              <div className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                No threads yet
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread.id)}
                  className={`border-2 px-3 py-2 text-left hover:bg-neutral-300 dark:hover:bg-neutral-800 ${
                    currentThreadId === thread.id
                      ? "border-green-900 bg-neutral-300 dark:border-green-500 dark:bg-neutral-800"
                      : "border-transparent bg-neutral-100 dark:bg-neutral-950"
                  }`}
                >
                  <div className="line-clamp-2 break-words">
                    {thread.title || `Thread ${thread.id}`}
                  </div>
                </button>
              ))
            )}
          </div>
          {hasMoreThreads && (
            <button
              onClick={() => onLoadMore()}
              className="flex items-center justify-center gap-1 bg-indigo-200 px-1 py-1 text-indigo-900 hover:bg-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:hover:bg-indigo-700"
            >
              <ChevronDownIcon className="h-4 w-4" />
              Load More
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Theme</label>
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
