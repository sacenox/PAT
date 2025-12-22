import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { useEffect } from "react";

export function useTheme() {
  const [themeMode, setThemeMode] = useLocalStorage<"device" | "dark" | "light">(
    "theme.mode",
    "device"
  );

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
    } else {
      applyTheme(themeMode);
    }
  }, [themeMode]);

  const handleThemeChange = (mode: "device" | "dark" | "light") => {
    setThemeMode(mode);
    applyTheme(mode);
  };

  return { themeMode, handleThemeChange };
}
