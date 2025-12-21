import { Message } from "@/src/lib/db/schema";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches messages for a given thread using react-query.
 *
 * @param threadId - The ID of the thread whose messages you want to fetch, or null to skip fetching.
 * @param optionalRoles - (Optional) Array of message roles (e.g., ["user", "assistant"]) to filter retrieved messages.
 * @returns react-query's useQuery result containing messages and error state.
 */
export function useThreadMessages(threadId: number | null, optionalRoles: string[] = []) {
  return useQuery<{ messages: Message[] }, Error>({
    queryKey: ["threadMessages", threadId],
    queryFn: async () => {
      if (!threadId) {
        console.error("Thread ID is missing");
        return [];
      }
      const requestParams = new URLSearchParams();
      if (optionalRoles.length > 0) {
        requestParams.set("optional_roles", optionalRoles.join(","));
      }
      const response = await fetch(`/api/threads/${threadId}/messages?${requestParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch thread messages: ${response.statusText}`);
      }
      return response.json();
    },
  });
}
