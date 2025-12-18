import { useState, useEffect } from "react";

export function useModel() {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");

  // Validate and sync the selected model with available models
  useEffect(() => {
    const validateModel = async () => {
      const savedModel = localStorage.getItem("selectedModel") || "gpt-oss";

      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        const availableModels = data.models || [];

        if (availableModels.length === 0) {
          // No models available, keep default
          setSelectedModel("gpt-oss");
          localStorage.setItem("selectedModel", "gpt-oss");
          return;
        }

        // Check if saved model exists in available models
        const modelExists = availableModels.some(
          (m: { name: string; model: string }) => m.model === savedModel
        );

        if (modelExists) {
          // Model is valid, use it
          setSelectedModel(savedModel);
        } else {
          // Model doesn't exist, fall back to first available model
          const fallbackModel = availableModels[0].model;
          setSelectedModel(fallbackModel);
          localStorage.setItem("selectedModel", fallbackModel);
        }
      } catch (error) {
        console.error("Failed to validate model", error);
        // On error, use saved model or default
        setSelectedModel(savedModel);
      }
    };

    validateModel();
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selectedModel", model);
  };

  return { selectedModel, handleModelChange };
}
