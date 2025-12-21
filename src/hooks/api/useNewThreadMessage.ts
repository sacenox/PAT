"use client";

import { Message } from "@/src/lib/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useNewThreadMessage(
  threadId: number | null,
  message: string,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient();

  return useMutation<{ message: Message }, Error>({
    mutationFn: async () => {
      if (!threadId) {
        throw new Error("Thread ID is required");
      }

      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      if (!threadId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["threadMessages", threadId] });
      onSuccess?.();
    },
  });
}
