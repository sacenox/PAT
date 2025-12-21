import { useEffect, useState } from "react";
/**
 * Custom hook for managing theme mode (device, dark, or light).
 * Automatically applies the theme and listens for system preference changes when in device mode.
 *
 * @returns Object containing:
 *   - `themeMode` - Current theme mode: "device", "dark", or "light"
 *   - `handleThemeChange` - Function to change the theme mode
 */
export function useTheme() {
  const [themeMode, setThemeMode] = useState<"device" | "dark" | "light">("device");

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
