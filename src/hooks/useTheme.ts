import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useTheme() {
  const [themeMode, setThemeMode] = useLocalStorage<"device" | "dark" | "light">(
    "themeMode",
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
    }
  }, [themeMode]);

  const handleThemeChange = (mode: "device" | "dark" | "light") => {
    setThemeMode(mode);
    applyTheme(mode);
  };

  return { themeMode, handleThemeChange };
}
