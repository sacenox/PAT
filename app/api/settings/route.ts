import { NextResponse } from "next/server";
import { getCache, setCache } from "@/src/lib/cache";
import { getFirstAvailableModel } from "@/src/lib/ollama/models";

const SETTINGS_CACHE_KEY = "app_settings";

type Settings = {
  maxPromptLength: "none" | 1024 | 4096;
  selectedModel?: string;
  location?: string;
  currentTime?: string;
};

export async function GET() {
  try {
    const settings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    if (settings) {
      return NextResponse.json({ settings });
    }

    // If no settings exist, get the first available model
    const firstModel = await getFirstAvailableModel();
    const defaultSettings: Settings = {
      maxPromptLength: "none",
      selectedModel: firstModel || undefined,
    };

    return NextResponse.json({ settings: defaultSettings });
  } catch {
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { maxPromptLength, selectedModel, location, currentTime } = await request.json();

    let settings: Partial<Settings> = {};

    // Validate and set maxPromptLength if provided
    if (maxPromptLength !== undefined) {
      if (maxPromptLength !== "none" && maxPromptLength !== 1024 && maxPromptLength !== 4096) {
        return NextResponse.json({ error: "Invalid maxPromptLength value" }, { status: 400 });
      }
      settings.maxPromptLength = maxPromptLength;
    }

    // Validate and set selectedModel if provided
    if (selectedModel !== undefined) {
      if (typeof selectedModel !== "string") {
        return NextResponse.json({ error: "Invalid selectedModel value" }, { status: 400 });
      }
      settings.selectedModel = selectedModel;
    }

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

    // Get existing settings and merge, prefering the ones in the request
    const existingSettings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    if (existingSettings) {
      settings = { ...existingSettings, ...settings };
    }

    if (!settings.selectedModel) {
      const firstModel = await getFirstAvailableModel();
      settings.selectedModel = firstModel;
    }

    // Update the cache with new settings.
    await setCache(SETTINGS_CACHE_KEY, settings);

    return NextResponse.json({ settings: settings });
  } catch {
    return NextResponse.json({ error: "Failed to set settings" }, { status: 500 });
  }
}
