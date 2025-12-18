import { NextResponse } from "next/server";
import ollama from "ollama";

export async function GET() {
  try {
    const response = await ollama.list();
    const models = (response.models || []).map((model) => ({
      name: model.name,
      model: model.name, // Use name as the model identifier
    }));
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
