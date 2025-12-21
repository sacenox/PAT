"use client";

import { Message } from "@/src/lib/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useNewThreadMessage(threadId: number, message: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<{ message: Message }, Error>({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ["threadMessages", threadId] });
      onSuccess?.();
    },
  });
}
