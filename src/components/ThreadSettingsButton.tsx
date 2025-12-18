"use client";

import { useState } from "react";
import GearIcon from "@/src/components/icons/GearIcon";
import ThreadSettingsModal from "@/src/components/ThreadSettingsModal";
import type { Thread } from "@/src/lib/db/schema";

type ThreadSettingsButtonProps = {
  thread: Thread;
  onUpdateThread: (
    threadId: number,
    updates: { model?: string; maxPromptLength?: "none" | 1024 | 4096 | null }
  ) => Promise<void>;
  onDeleteThread: (threadId: number) => Promise<void>;
  onError?: (error: string) => void;
};

export default function ThreadSettingsButton({
  thread,
  onUpdateThread,
  onDeleteThread,
  onError,
}: ThreadSettingsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="pointer-events-auto flex w-fit items-center gap-2 rounded-lg bg-neutral-300/80 px-3 py-1 text-neutral-600 hover:bg-neutral-400/80 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-700/80"
        aria-label="Thread settings"
      >
        <GearIcon className="h-4 w-4" />
        <span className="text-xs">Thread settings</span>
      </button>
      <ThreadSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thread={thread}
        onUpdateThread={onUpdateThread}
        onDeleteThread={onDeleteThread}
        onError={onError}
      />
    </>
  );
}
