import { getCache, incrementCache, setCache } from "@/src/lib/cache";
import { google } from "googleapis";
import type { customsearch_v1 } from "googleapis/build/src/apis/customsearch/v1";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function webSearch(query: string): Promise<customsearch_v1.Schema$Result[] | null> {
  // Check cache first
  const cacheKey = `websearch:${query.toLowerCase().trim()}`;
  const cached = await getCache<customsearch_v1.Schema$Result[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check rate limit, reset every 24 hours
  const countKey = `websearch:count:${query.toLowerCase().trim()}`;
  const count = await getCache<number>(countKey);
  if (count === null) {
    await setCache(countKey, 1, CACHE_TTL_MS);
  } else {
    await incrementCache(countKey);
  }

  if (count && count >= 100) {
    throw new Error("Service temporarily unavailable, rate limit exceeded");
  }

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    throw new Error("Service unavailable");
  }

  const customsearch = google.customsearch("v1");
  const res = await customsearch.cse.list({
    cx: cx,
    q: query,
    auth: apiKey,
  });

  if (!res.data.items || res.data.items.length === 0) {
    return null;
  }

  const results = res.data.items;
  await setCache(cacheKey, results, CACHE_TTL_MS);
  return results;
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
