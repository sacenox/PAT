import { Message } from "@/src/lib/db/schema";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useThreadMessages(
  threadId: number | null,
  optionalRoles: string[] = [],
  onSuccess: (messages: Message[]) => void
) {
  const queryResult = useQuery<{ messages: Message[] }, Error>({
    queryKey: ["threadMessages", threadId],
    queryFn: async () => {
      if (!threadId) {
        console.error("Thread ID is missing");
        return { messages: [] };
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
    enabled: threadId !== null,
  });

  useEffect(() => {
    if (queryResult.data) {
      onSuccess(queryResult.data.messages);
    }
  }, [queryResult.data, onSuccess]);

  return queryResult;
}
