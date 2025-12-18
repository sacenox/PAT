import { NextResponse } from "next/server";
import { getCache, setCache } from "@/src/lib/cache";

const SETTINGS_CACHE_KEY = "app_settings";

type Settings = {
  maxPromptLength: "none" | 1024 | 4096;
  selectedModel?: string;
};

export async function GET() {
  try {
    const settings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    return NextResponse.json({
      settings: settings || { maxPromptLength: "none", selectedModel: "gpt-oss" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { maxPromptLength, selectedModel } = await request.json();

    const settings: Partial<Settings> = {};

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

    // Get existing settings and merge
    const existingSettings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    const mergedSettings: Settings = {
      maxPromptLength: settings.maxPromptLength ?? existingSettings?.maxPromptLength ?? "none",
      selectedModel: settings.selectedModel ?? existingSettings?.selectedModel ?? "gpt-oss",
    };

    await setCache(SETTINGS_CACHE_KEY, mergedSettings);

    return NextResponse.json({ settings: mergedSettings });
  } catch {
    return NextResponse.json({ error: "Failed to set settings" }, { status: 500 });
  }
}
