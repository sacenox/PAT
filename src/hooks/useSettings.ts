import { useState, useEffect } from "react";

export function useSettings(onError?: (error: string) => void) {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");
  const [maxPromptLength, setMaxPromptLength] = useState<"none" | 1024 | 4096>("none");
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState<string | undefined>(undefined);

  // Load settings from API and validate model against available models
  useEffect(() => {
    const loadAndValidateSettings = async () => {
      try {
        // Load saved settings from API
        const settingsRes = await fetch("/api/settings");
        if (!settingsRes.ok) {
          const errorData = await settingsRes.json().catch((parseError) => {
            throw new Error(
              `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
            );
          });
          throw new Error(errorData.error || settingsRes.statusText);
        }
        const settingsData = await settingsRes.json();
        const settings = settingsData.settings || {};
        const savedModel = settings.selectedModel || "";
        const savedMaxPromptLength = settings.maxPromptLength || "none";
        const savedLocation = settings.location;
        const savedCurrentTime = settings.currentTime;

        // Get available models
        const modelsRes = await fetch("/api/models");
        if (!modelsRes.ok) {
          const errorData = await modelsRes.json().catch((parseError) => {
            throw new Error(
              `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
            );
          });
          throw new Error(errorData.error || modelsRes.statusText);
        }
        const modelsData = await modelsRes.json();
        const availableModels = modelsData.models || [];

        // Set maxPromptLength
        setMaxPromptLength(savedMaxPromptLength);
        // Set location and currentTime
        setLocation(savedLocation);
        setCurrentTime(savedCurrentTime);

        // Post current time in ISO format to settings on app start
        const currentTimeISO = new Date().toISOString();
        try {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentTime: currentTimeISO }),
          });
          setCurrentTime(currentTimeISO);
        } catch (error) {
          // Silently fail - don't block app startup if time update fails
          if (onError && error instanceof Error) {
            onError(error.message);
          }
        }

        if (availableModels.length === 0) {
          // No models available, keep default
          setSelectedModel("gpt-oss");
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
          // Save fallback to API
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedModel: fallbackModel }),
          });
        }
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error.message);
        }
        // On error, keep defaults
        setSelectedModel("");
        setMaxPromptLength("none");
        setLocation(undefined);
        setCurrentTime(undefined);
      }
    };

    loadAndValidateSettings();
  }, [onError]);

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    // Save to API
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedModel: model }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || res.statusText);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    }
  };

  const handleMaxPromptLengthChange = async (value: "none" | 1024 | 4096) => {
    setMaxPromptLength(value);
    // Save to API
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPromptLength: value }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || res.statusText);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    }
  };

  return {
    selectedModel,
    handleModelChange,
    maxPromptLength,
    handleMaxPromptLengthChange,
  };
}

