import { getCache, setCache } from "@/src/lib/cache";
import { debug } from "@/src/lib/debug";
import { parse } from "node-html-better-parser";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type FetchPageResult = {
  title: string;
  content: string;
  links: string[];
};

const extractText = (el: unknown): string => {
  if (!el || typeof el !== "object") return "";
  const elem = el as { text?: string; childNodes?: unknown[] };
  let text = elem.text || "";
  if (elem.childNodes) {
    for (const child of elem.childNodes) {
      text += extractText(child);
    }
  }
  return text;
};

export async function fetchPage(url: string): Promise<FetchPageResult> {
  const cached = await getCache<FetchPageResult>(`fetchpage:${url}`);
  if (cached) {
    return cached;
  }

  const result: FetchPageResult = {
    title: "",
    content: "",
    links: [],
  };

  const response = await fetch(url);
  const html = await response.text();
  const root = parse(html);

  const title = root.querySelector("title")?.text;
  const content = extractText(root.querySelector("body"));
  const links = root.querySelectorAll("a").map((a) => a.getAttribute("href"));

  result.title = title?.trim() || "";
  result.content = content?.trim() || "";
  result.links = links.filter((link): link is string => link !== null);

  debug(`fetched page ${url}`, result);

  await setCache<FetchPageResult>(`fetchpage:${url}`, result, CACHE_TTL_MS);

  return result;
}

export const fetchPageTool = {
  type: "function" as const,
  function: {
    name: "fetch_page",
    description:
      "Fetch a web page and return the title, content, and links in JSON format. Use this tool when asked to fetch a web page, retrieve content from a URL, or read information from a specific webpage.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the web page to fetch (must be HTTP or HTTPS).",
        },
      },
      required: ["url"],
    },
  },
};
