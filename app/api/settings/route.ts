import { NextResponse } from "next/server";
import { getCache, setCache } from "@/src/lib/cache";

const SETTINGS_CACHE_KEY = "app_settings";

type Settings = {
  maxPromptLength: "none" | 1024 | 4096;
};

export async function GET() {
  try {
    const settings = await getCache<Settings>(SETTINGS_CACHE_KEY);
    return NextResponse.json({
      settings: settings || { maxPromptLength: "none" },
    });
  } catch (error) {
    console.error("Get settings error", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { maxPromptLength } = await request.json();

    // Validate maxPromptLength
    if (maxPromptLength !== "none" && maxPromptLength !== 1024 && maxPromptLength !== 4096) {
      return NextResponse.json({ error: "Invalid maxPromptLength value" }, { status: 400 });
    }

    const settings: Settings = { maxPromptLength };
    await setCache(SETTINGS_CACHE_KEY, settings);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Set settings error", error);
    return NextResponse.json({ error: "Failed to set settings" }, { status: 500 });
  }
}
