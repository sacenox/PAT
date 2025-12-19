import { NextResponse } from "next/server";
import { getCache, setCache } from "@/src/lib/cache";

const SETTINGS_CACHE_KEY = "app_settings";

type Settings = {
  location?: string;
  currentTime?: string;
  timezone?: string;
};

export async function GET() {
  try {
    const settings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    if (settings) {
      return NextResponse.json({ settings });
    }

    const defaultSettings: Settings = {};

    return NextResponse.json({ settings: defaultSettings });
  } catch {
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { location, currentTime, timezone } = await request.json();

    let settings: Partial<Settings> = {};

    // Validate and set location if provided
    if (location !== undefined) {
      if (typeof location !== "string") {
        return NextResponse.json({ error: "Invalid location value" }, { status: 400 });
      }
      settings.location = location;
    }

    // Validate and set currentTime if provided
    if (currentTime !== undefined) {
      if (typeof currentTime !== "string") {
        return NextResponse.json({ error: "Invalid currentTime value" }, { status: 400 });
      }
      settings.currentTime = currentTime;
    }

    // Validate and set timezone if provided
    if (timezone !== undefined) {
      if (typeof timezone !== "string") {
        return NextResponse.json({ error: "Invalid timezone value" }, { status: 400 });
      }
      settings.timezone = timezone;
    }

    // Get existing settings and merge, prefering the ones in the request
    const existingSettings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    if (existingSettings) {
      settings = { ...existingSettings, ...settings };
    }

    // Update the cache with new settings.
    await setCache(SETTINGS_CACHE_KEY, settings);

    return NextResponse.json({ settings: settings });
  } catch {
    return NextResponse.json({ error: "Failed to set settings" }, { status: 500 });
  }
}
