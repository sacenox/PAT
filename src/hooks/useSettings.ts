import { useState, useEffect } from "react";

export function useSettings(onError?: (error: string) => void) {
  const [location, setLocation] = useState<string>("");

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
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
        const savedLocation = settings.location || "";

        // Get browser timezone and post current time in ISO format to settings on app start
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const currentTimeISO = new Date().toISOString();
        
        // Use timezone as default location if no location is set
        const locationToUse = savedLocation || browserTimezone;
        setLocation(locationToUse);

        try {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              currentTime: currentTimeISO,
              timezone: browserTimezone,
              ...(savedLocation ? {} : { location: browserTimezone }),
            }),
          });
        } catch (error) {
          // Silently fail - don't block app startup if time update fails
          if (onError && error instanceof Error) {
            onError(error.message);
          }
        }
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error.message);
        }
        // On error, keep defaults
        setLocation("");
      }
    };

    loadSettings();
  }, [onError]);

  const handleLocationChange = async (value: string) => {
    setLocation(value);
    // Save to API
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: value }),
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
    location,
    handleLocationChange,
  };
}
