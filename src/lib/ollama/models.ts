/* personal-assistant-thing/src/lib/ollama/models.ts */
// Utility functions for working with Ollama models

import ollama from "ollama";

/**
 * Gets the first available model from Ollama.
 * @returns The name of the first model, or null if no models are available.
 */
export async function getFirstAvailableModel(): Promise<string | null> {
  try {
    const response = await ollama.list();
    const models = response.models || [];
    return models.length > 0 ? models[0].name : null;
  } catch {
    return null;
  }
}
