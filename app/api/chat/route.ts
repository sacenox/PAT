import { NextResponse } from "next/server";
import { fetchOllamaResponse } from "../../../src/lib/ollama";
import { fetchDuckDuckGo } from "../../../src/lib/duckduckgo";

export async function POST(request: Request) {
  const { message } = await request.json();

  try {
    // 1. Search DuckDuckGo
    const searchResults = await fetchDuckDuckGo(message);

    console.debug("searchResults:", searchResults);

    // 2. Build prompt
    const prompt = `${message}\n\nRelevant info from DuckDuckGo: ${JSON.stringify(
      searchResults,
    )}\n\nAssistant:`;

    const answer = await fetchOllamaResponse(prompt);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json(
      { answer: "Sorry, something went wrong." },
      { status: 500 },
    );
  }
}
