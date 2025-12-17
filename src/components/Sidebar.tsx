"use client";

import type { Thread } from "@/src/lib/db/schema";
import PlusIcon from "@/src/components/icons/PlusIcon";
import ChevronDownIcon from "@/src/components/icons/ChevronDownIcon";
import Anchor from "@/src/components/Anchor";

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
    <div className="h-full w-64 overflow-y-auto bg-neutral-50 p-1 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500">Threads</label>
          <div className="flex flex-col gap-2">
            <Anchor href="#" onClick={(e) => {
              e.preventDefault();
              onCreateNewThread();
            }}>
              <PlusIcon className="h-4 w-4" />
              New Thread
            </Anchor>
            <div className="flex flex-col">
              {threads.length === 0 ? (
                <div className="px-3 py-2 text-neutral-600 dark:text-neutral-400">No threads yet</div>
              ) : (
                threads.map((thread) => {
                  const isSelected = currentThreadId === thread.id;
                  return (
                    <Anchor
                      key={thread.id}
                      href={`#thread-${thread.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onThreadSelect(thread.id);
                      }}
                      isSelected={isSelected}
                    >
                      {thread.title || `Thread ${thread.id}`}
                    </Anchor>
                  );
                })
              )}
            </div>
          </div>
          {hasMoreThreads && (
            <Anchor href="#" className="text-xs" onClick={(e) => {
              e.preventDefault();
              onLoadMore();
            }}>
              <ChevronDownIcon className="h-3 w-3 mt-0.5" />
              Load More
            </Anchor>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500">Theme</label>
          <select
            value={themeMode}
            onChange={(e) => onThemeChange(e.target.value as "device" | "dark" | "light")}
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200"
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
