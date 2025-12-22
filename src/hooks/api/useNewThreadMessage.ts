"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type StreamedMessage = {
  role: string;
  content: string;
  thinking?: string;
};

export function useNewThreadMessage(
  threadId: number | null,
  message: string,
  onMessageChunk?: (msg: StreamedMessage) => void,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      if (!threadId) {
        throw new Error("Thread ID is required");
      }

      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to create message: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[useNewThreadMessage] Stream finished reading");
          break;
        }
        accumulated += decoder.decode(value, { stream: true });

        // Split stream into lines
        const lines = accumulated.split("\n\n");
        accumulated = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.replace(/^data: /, ""));
              onMessageChunk?.(json as StreamedMessage);
            } catch {
              // ignore JSON parse errors for invalid chunks
            }
          }
        }
      }
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
