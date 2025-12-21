import { Thread } from "@/src/lib/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useNewThread(
  userMessage: string,
  model: string,
  maxPromptLength: "none" | 1024 | 4096,
  userPrompt: string,
  time: string,
  timezone: string,
  onSuccess?: (threadId: number) => void | undefined
) {
  const queryClient = useQueryClient();

  return useMutation<{ thread: Thread }, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ userMessage, model, maxPromptLength, userPrompt, time, timezone }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      onSuccess?.(data.thread.id);
    },
  });
}
