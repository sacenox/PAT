import { useState, useEffect } from "react";
import { useFetch } from "./useFetch";

export type Model = {
  name: string;
  model: string;
};

/**
 * Custom hook for fetching and managing available Ollama models.
 * @param onError - Optional error callback function
 * @returns Object containing models array and loading state
 */
export function useModels(onError?: (error: string) => void) {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchWithErrorHandling = useFetch();

  useEffect(() => {
    let cancelled = false;

    fetchWithErrorHandling<{ models: Model[] }>("/api/models", {
      errorMessage: "Failed to fetch models",
      onError,
    }).then((data) => {
      if (!cancelled && data) {
        setModels(data.models || []);
        setIsLoading(false);
      } else if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchWithErrorHandling, onError]);

  return { models, isLoading };
}

/**
 * Validates if a model exists in the available models list.
 * @param modelName - The model name to validate
 * @param models - Array of available models
 * @returns True if the model exists
 */
export function isValidModel(modelName: string, models: Model[]): boolean {
  return models.some((m) => m.model === modelName);
}
