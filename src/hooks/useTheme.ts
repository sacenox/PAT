import { useState, useEffect } from "react";

export function useTheme() {
  const [themeMode, setThemeMode] = useState<"device" | "dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("themeMode") as "device" | "dark" | "light" | null;
      return savedMode || "device";
    }
    return "device";
  });

  const applyTheme = (mode: "device" | "dark" | "light") => {
    let shouldBeDark = false;
    if (mode === "device") {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      shouldBeDark = mode === "dark";
    }

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === "device") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("device");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  const handleThemeChange = (mode: "device" | "dark" | "light") => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode);
  };

  return { themeMode, handleThemeChange };
}
