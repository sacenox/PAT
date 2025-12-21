"use client";

import BowtieIcon from "@/src/components/icons/BowtieIcon";
import GearIcon from "@/src/components/icons/GearIcon";
import PlusIcon from "@/src/components/icons/PlusIcon";
import { useAppContext } from "@/src/components/App";
import Button from "@/src/components/Button";
import ChevronDownIcon from "./icons/ChevronDownIcon";
import { useThreads } from "../hooks/api/useThreads";

export default function Sidebar() {
  const { selectedThreadId, setSelectedThreadId } = useAppContext();
  const {
    data: threadsData,
    isLoading: isThreadsLoading,
    error: threadsError,
    fetchNextPage,
    hasNextPage,
  } = useThreads();

  const totalThreadCount = threadsData?.pages[0]?.totalCount ?? 0;
  const loadedThreadCount = threadsData?.pages.flatMap((page) => page.threads).length ?? 0;

  return (
    <div className="h-screen w-80 overflow-y-auto bg-neutral-50 p-8 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="flex flex-col gap-8">
        <div className="flex justify-center">
          <BowtieIcon className="mb-8 h-12 w-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setSelectedThreadId(null)}>
            <PlusIcon className="h-4 w-4" />
            New Thread
          </Button>
          <Button>
            <GearIcon className="h-4 w-4" />
            Settings
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <label className="px-2 text-neutral-500">
            Threads{" "}
            <span className="text-neutral-400 dark:text-neutral-500">
              ({loadedThreadCount} out of {totalThreadCount})
            </span>
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col text-neutral-600 dark:text-neutral-400">
              {isThreadsLoading
                ? "Loading threads..."
                : threadsError
                  ? "Failed to load threads"
                  : loadedThreadCount === 0
                    ? "No threads yet"
                    : threadsData?.pages
                        .flatMap((page) => page.threads)
                        .map((thread) => (
                          <Button
                            key={thread.id}
                            isSelected={selectedThreadId === thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                          >
                            {thread.title}
                          </Button>
                        ))}
            </div>
            {hasNextPage && (
              <Button onClick={() => fetchNextPage()}>
                <ChevronDownIcon className="h-4 w-4" />
                Load More
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
