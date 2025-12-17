import { NextResponse } from "next/server";
import ollama from "ollama";

/**
 * Model response from Ollama API
 * Based on OpenAPI spec: /api/tags returns { models: ModelSummary[] }
 */
interface ModelSummary {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface ListResponse {
  models: ModelSummary[];
}

export async function GET() {
  try {
    const response = (await ollama.list()) as ListResponse;
    // ollama.list() returns { models: ModelSummary[] }
    // Each model has a 'name' property that is used as the model identifier
    const models = (response.models || []).map((model: ModelSummary) => ({
      name: model.name,
      model: model.name, // Use name as the model identifier
    }));
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Failed to fetch models", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
