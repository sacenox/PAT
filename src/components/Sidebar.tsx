"use client";

import { useState } from "react";
import type { Thread } from "@/src/lib/db/schema";
import PlusIcon from "@/src/components/icons/PlusIcon";
import ChevronDownIcon from "@/src/components/icons/ChevronDownIcon";
import BowtieIcon from "@/src/components/icons/BowtieIcon";
import GearIcon from "@/src/components/icons/GearIcon";
import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import SettingsModal from "@/src/components/SettingsModal";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="h-full w-64 overflow-y-auto bg-neutral-50 p-1 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
        <div className="flex flex-col gap-2 p-4">
          <div className="flex justify-center pb-4">
            <BowtieIcon className="h-12 w-12" />
          </div>
          <div className="flex flex-col gap-2">
            <SecondaryButton
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCreateNewThread();
              }}
            >
              <PlusIcon className="h-4 w-4" />
              New Thread
            </SecondaryButton>
            <SecondaryButton
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
            >
              <GearIcon className="h-4 w-4" />
              Settings
            </SecondaryButton>
            <label className="text-neutral-500">Threads</label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                {threads.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                    No threads yet
                  </div>
                ) : (
                  threads.map((thread) => {
                    const isSelected = currentThreadId === thread.id;
                    return (
                      <SecondaryButton
                        key={thread.id}
                        href={`#thread-${thread.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onThreadSelect(thread.id);
                        }}
                        isSelected={isSelected}
                        className="text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {thread.title || `Thread ${thread.id}`}
                        </span>
                      </SecondaryButton>
                    );
                  })
                )}
              </div>
            </div>
            {hasMoreThreads && (
              <SecondaryButton
                href="#"
                className="text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onLoadMore();
                }}
              >
                <ChevronDownIcon className="mt-0.5 h-3 w-3" />
                Load More
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        onThemeChange={onThemeChange}
      />
    </>
  );
}
