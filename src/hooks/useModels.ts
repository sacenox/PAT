import { useState, useEffect } from "react";
import { handleError } from "@/src/lib/errors";

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

  useEffect(() => {
    let cancelled = false;

    fetch("/api/models")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch models: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setModels(data.models || []);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsLoading(false);
          handleError(error, onError);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

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

