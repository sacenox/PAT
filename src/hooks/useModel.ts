import { useState, useEffect } from "react";

export function useModel() {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");

  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selectedModel", model);
  };

  return { selectedModel, handleModelChange };
}
