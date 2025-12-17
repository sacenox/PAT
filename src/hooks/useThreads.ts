import { useState, useEffect } from "react";
import type { Thread } from "@/src/lib/db/schema";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalThreadCount, setTotalThreadCount] = useState<number>(0);
  const [hasMoreThreads, setHasMoreThreads] = useState<boolean>(true);

  const loadThreads = async (limit: number = 8) => {
    try {
      const res = await fetch(`/api/threads?limit=${limit}`);
      const data = await res.json();
      const threadsList = data.threads || [];
      setThreads(threadsList);
      setHasMoreThreads(data.hasMore || false);
      setTotalThreadCount(data.totalCount || 0);
    } catch (error) {
      console.error("Failed to load threads", error);
    }
  };

  const loadMoreThreads = async (limit: number = 8) => {
    try {
      const offset = threads.length;
      const res = await fetch(`/api/threads?offset=${offset}&limit=${limit}`);
      const data = await res.json();
      const newThreads = data.threads || [];
      if (newThreads.length > 0) {
        setThreads((prev) => [...prev, ...newThreads]);
        setHasMoreThreads(data.hasMore || false);
      } else {
        setHasMoreThreads(false);
      }
    } catch (error) {
      console.error("Failed to load more threads", error);
    }
  };

  const createThread = async (
    titleOverride?: string,
    firstMessage?: string
  ): Promise<number | null> => {
    try {
      const title = titleOverride || (firstMessage ? firstMessage.substring(0, 100) : "New Thread");
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      const newThread = data.thread;
      
      // Reload threads to get the full list
      await loadThreads(8);
      
      return newThread.id;
    } catch (error) {
      console.error("Failed to create thread", error);
      return null;
    }
  };

  useEffect(() => {
    loadThreads(8);
  }, []);

  return {
    threads,
    totalThreadCount,
    hasMoreThreads,
    loadThreads,
    loadMoreThreads,
    createThread,
  };
}

