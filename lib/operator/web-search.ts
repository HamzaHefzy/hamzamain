import { fetchWithTimeout } from "@/lib/http";

export type WebSearchResult = {
  title: string;
  url: string;
  description: string;
  age: string | null;
  language: string | null;
};

export function webSearchConfigured() {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY);
}

export async function searchWeb(input: {
  query: string;
  count?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
}) {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) throw new Error("BRAVE_SEARCH_API_KEY is not configured.");

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", input.query.trim());
  url.searchParams.set("count", String(Math.max(1, Math.min(input.count ?? 8, 20))));
  url.searchParams.set("country", "US");
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("ui_lang", "en-US");
  url.searchParams.set("safesearch", "moderate");
  if (input.freshness) url.searchParams.set("freshness", input.freshness);

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": key,
    },
  });
  const payload = await response.json().catch(() => ({})) as {
    web?: { results?: Array<Record<string, unknown>> };
    error?: { detail?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.detail ?? "Brave Search request failed.");
  }

  return (payload.web?.results ?? [])
    .map((item): WebSearchResult | null => {
      const title = typeof item.title === "string" ? item.title : "";
      const url = typeof item.url === "string" ? item.url : "";
      if (!title || !url) return null;
      return {
        title,
        url,
        description:
          typeof item.description === "string" ? item.description : "",
        age: typeof item.age === "string" ? item.age : null,
        language: typeof item.language === "string" ? item.language : null,
      };
    })
    .filter((item): item is WebSearchResult => Boolean(item));
}
