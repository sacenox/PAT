import { useQuery } from "@tanstack/react-query";

export type Model = {
  name: string;
  model: string;
};

export function useModels() {
  return useQuery<{ models: Model[] }, Error>({
    queryKey: ["models"],
    queryFn: async () => {
      const response = await fetch("/api/models");
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      return response.json();
    },
  });
}
