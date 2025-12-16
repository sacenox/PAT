export interface DuckDuckGoResult {
  title: string;
  snippet: string;
  url: string;
}

const DDG_ENDPOINT = "https://api.duckduckgo.com/";

export async function fetchDuckDuckGo(query: string): Promise<DuckDuckGoResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    no_html: "1",
    skip_disambig: "1",
  });

  const url = `${DDG_ENDPOINT}?${params.toString()}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`DuckDuckGo API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const results: DuckDuckGoResult[] = [];

  // DuckDuckGo returns search results in the "RelatedTopics" array.
  // Each item may contain a nested array; we flatten only the first level.
  const topics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  for (const item of topics) {
    if (item.Text && item.FirstURL) {
      // Use the first line of the text as a title
      const title = item.Text.split("\n")[0];
      // Limit snippet to 70 characters
      const snippet = item.Text.length > 70 ? item.Text.slice(0, 70) + "…" : item.Text;
      results.push({
        title,
        snippet,
        url: item.FirstURL,
      });
    }
  }

  return results;
}
