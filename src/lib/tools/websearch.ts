import { getCache, setCache } from "@/src/lib/cache";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type SearXNGResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export async function webSearch(query: string): Promise<SearXNGResult[] | null> {
  // Check cache first
  const cacheKey = `websearch:${query.toLowerCase().trim()}`;
  const cached = await getCache<SearXNGResult[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8888";
  const searchUrl = new URL("/search", searxngUrl);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "json");

  const response = await fetch(searchUrl.toString());
  if (!response.ok) {
    throw new Error(`SearXNG request failed: ${response.statusText}`);
  }

  const { results } = await response.json();
  if (!results || results.length === 0) {
    return null;
  }
  const prunnedResults = results.map((result: SearXNGResult) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
  }));

  await setCache<SearXNGResult[]>(cacheKey, prunnedResults, CACHE_TTL_MS);
  return prunnedResults;
}

export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web, use this tool to augment your responses with current and local information, news, articles, or any other relevant content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
};
