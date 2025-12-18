import { NextResponse } from "next/server";
import ollama from "ollama";

export async function GET() {
  try {
    const response = await ollama.list();
    // ollama.list() returns { models: ModelResponse[] }
    // Each model has a 'name' property that is used as the model identifier
    const models = (response.models || []).map((model) => ({
      name: model.name,
      model: model.name, // Use name as the model identifier
    }));
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
