import type { Thread } from "@/src/lib/db/schema";
import { useInfiniteQuery } from "@tanstack/react-query";

export type ThreadsData = {
  threads: Thread[];
  hasMore: boolean;
  totalCount: number;
};

export function useThreads(limit: number = 8) {
  return useInfiniteQuery<ThreadsData, Error>({
    queryKey: ["threads", limit],
    queryFn: async ({ pageParam }): Promise<ThreadsData> => {
      const requestParams = new URLSearchParams();
      requestParams.set("offset", pageParam ? pageParam.toString() : "0");
      requestParams.set("limit", limit.toString() ?? "8");
      const response = await fetch(`/api/threads?${requestParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.statusText}`);
      }
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.reduce((acc, page) => acc + page.threads.length, 0);
      return lastPage.hasMore ? nextOffset : undefined;
    },
  });
}
