import { useState, useEffect } from "react";

export function useMaxPromptLength() {
  const [maxPromptLength, setMaxPromptLength] = useState<"none" | 1024 | 4096>("none");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const settings = data.settings || { maxPromptLength: "none" };
        setMaxPromptLength(settings.maxPromptLength || "none");
      } catch (error) {
        console.error("Failed to load settings", error);
        setMaxPromptLength("none");
      }
    };

    loadSettings();
  }, []);

  const handleMaxPromptLengthChange = async (value: "none" | 1024 | 4096) => {
    setMaxPromptLength(value);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPromptLength: value }),
      });
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  return { maxPromptLength, handleMaxPromptLengthChange };
}
