"use client";

import Main from "@/src/components/Main";
import Sidebar from "@/src/components/Sidebar";
import { useModels, type Model } from "@/src/hooks/api/useModels";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { useTheme } from "@/src/hooks/useTheme";
import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

export type AppContextType = {
  selectedModel: Model | null;
  setSelectedModel: Dispatch<SetStateAction<Model | null>>;
  maxPromptLength: number | null;
  setMaxPromptLength: Dispatch<SetStateAction<number | null>>;
  userPrompt: string;
  setUserPrompt: Dispatch<SetStateAction<string>>;
  models: Model[];
  isModelsLoading: boolean;
  modelsError: Error | null;
  selectedThreadId: number | null;
  setSelectedThreadId: Dispatch<SetStateAction<number | null>>;
  showSystemMessages: boolean;
  setShowSystemMessages: Dispatch<SetStateAction<boolean>>;
  showToolMessages: boolean;
  setShowToolMessages: Dispatch<SetStateAction<boolean>>;
  themeMode: "device" | "dark" | "light";
  handleThemeChange: (mode: "device" | "dark" | "light") => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

export default function App() {
  const { themeMode, handleThemeChange } = useTheme();
  const { data: modelsData, isLoading: isModelsLoading, error: modelsError } = useModels();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);

  const [selectedModel, setSelectedModel] = useLocalStorage<Model | null>(
    "app.selectedModel",
    null
  );
  const [maxPromptLength, setMaxPromptLength] = useLocalStorage<number | null>(
    "app.maxPromptLength",
    null
  );
  const [userPrompt, setUserPrompt] = useLocalStorage<string>("app.userPrompt", "");
  const [showSystemMessages, setShowSystemMessages] = useLocalStorage<boolean>(
    "app.showSystemMessages",
    true
  );
  const [showToolMessages, setShowToolMessages] = useLocalStorage<boolean>(
    "app.showToolMessages",
    true
  );

  return (
    <AppContext.Provider
      value={{
        models: modelsData?.models || [],
        isModelsLoading,
        modelsError,
        selectedModel,
        setSelectedModel,
        maxPromptLength,
        setMaxPromptLength,
        userPrompt,
        setUserPrompt,
        selectedThreadId,
        setSelectedThreadId,
        showSystemMessages,
        setShowSystemMessages,
        showToolMessages,
        setShowToolMessages,
        themeMode,
        handleThemeChange,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
        <Main />
        <Sidebar />
      </div>
    </AppContext.Provider>
  );
}
