import { useLocalStorage } from "./useLocalStorage";

type MessageDisplaySettings = {
  showSystemMessages: boolean;
  showToolMessages: boolean;
};

const DEFAULT_SETTINGS: MessageDisplaySettings = {
  showSystemMessages: false,
  showToolMessages: false,
};

/**
 * Custom hook for managing message display settings in localStorage
 * @returns A tuple of [settings, setSettings] similar to useState
 */
export function useMessageDisplaySettings(): [
  MessageDisplaySettings,
  (value: MessageDisplaySettings | ((prev: MessageDisplaySettings) => MessageDisplaySettings)) => void
] {
  return useLocalStorage<MessageDisplaySettings>("messageDisplaySettings", DEFAULT_SETTINGS);
}

