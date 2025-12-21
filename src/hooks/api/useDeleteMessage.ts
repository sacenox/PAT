"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useDeleteMessage(threadId: number, messageId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/threads/${threadId}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threadMessages", threadId] });
    },
  });
}
