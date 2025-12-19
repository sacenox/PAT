import { useEffect } from "react";
import { useModels, isValidModel } from "./useModels";

/**
 * Custom hook for validating and initializing model selection.
 * Automatically selects the first available model if the current selection is invalid.
 *
 * @param selectedModel - The currently selected model
 * @param setSelectedModel - Function to update the selected model
 */
export function useModelValidation(
  selectedModel: string,
  setSelectedModel: (model: string) => void
): void {
  const { models } = useModels();

  useEffect(() => {
    if (models.length === 0) return;

    // Validate that the saved model still exists
    if (selectedModel && isValidModel(selectedModel, models)) {
      return;
    }

    // If no saved model or it doesn't exist, get first available
    if (models.length > 0) {
      setSelectedModel(models[0].model);
    }
  }, [models, selectedModel, setSelectedModel]);
}
