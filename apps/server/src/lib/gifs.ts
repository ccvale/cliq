export type Gif = { id: string; url: string; previewUrl: string; width: number; height: number };

const GIPHY_HOST = /^https:\/\/media\d*\.giphy\.com\//;
export const isGiphyUrl = (url: string) => GIPHY_HOST.test(url);

/** GIF search through GIPHY. Needs a free GIPHY_API_KEY; without one the GIF button stays hidden. */
export async function searchGifs(apiKey: string, q: string, fetcher: typeof fetch = fetch): Promise<Gif[]> {
  const params = new URLSearchParams({ api_key: apiKey, limit: '24', rating: 'pg-13', bundle: 'messaging_non_clips' });
  if (q) params.set('q', q);
  const res = await fetcher(`https://api.giphy.com/v1/gifs/${q ? 'search' : 'trending'}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`gif search failed: ${res.status}`);
  const json = (await res.json()) as { data?: any[] };
  return (json.data ?? [])
    .map((g) => {
      const full = g.images?.fixed_width ?? g.images?.original;
      const preview = g.images?.fixed_width_small ?? full;
      return { id: String(g.id), url: String(full?.url ?? ''), previewUrl: String(preview?.url ?? ''), width: Number(full?.width), height: Number(full?.height) };
    })
    .filter((g) => isGiphyUrl(g.url) && g.width > 0 && g.height > 0);
}
