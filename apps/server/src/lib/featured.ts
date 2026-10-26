import { z } from 'zod';

export type FeaturedKind = 'song' | 'show' | 'movie';
export type Featured = { kind: FeaturedKind; title: string; subtitle: string; artworkUrl: string | null; previewUrl: string | null; link: string | null };

// Only Apple's own hosts, so a profile can't be used to load arbitrary images or tracking pixels on other people's phones.
const appleUrl = (hosts: string[]) =>
  z
    .string()
    .url()
    .max(500)
    .refine((u) => {
      const { protocol, hostname } = new URL(u);
      return protocol === 'https:' && hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
    }, 'Unsupported link');

export const featuredSchema = z.object({
  kind: z.enum(['song', 'show', 'movie']),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(120),
  artworkUrl: appleUrl(['mzstatic.com']).nullable(),
  previewUrl: appleUrl(['apple.com', 'mzstatic.com']).nullable(),
  link: appleUrl(['apple.com']).nullable(),
});

const ENTITY: Record<FeaturedKind, { media: string; entity: string }> = {
  song: { media: 'music', entity: 'song' },
  show: { media: 'tvShow', entity: 'tvSeason' },
  movie: { media: 'movie', entity: 'movie' },
};

/** Searches Apple's public catalog (no key needed). Songs come with a 30 second preview. */
export async function searchCatalog(kind: FeaturedKind, term: string, fetcher: typeof fetch = fetch): Promise<Featured[]> {
  const { media, entity } = ENTITY[kind];
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, media, entity, limit: '12', country: 'US' })}`;
  const res = await fetcher(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`catalog search failed: ${res.status}`);
  const json = (await res.json()) as { results?: Record<string, any>[] };
  const seen = new Set<string>();
  const out: Featured[] = [];
  for (const r of json.results ?? []) {
    // TV results are seasons ("The Office, Season 3"); show the series once.
    const title = String(kind === 'show' ? (r.artistName ?? r.collectionName ?? '') : (r.trackName ?? r.collectionName ?? '')).trim();
    const subtitle = String(
      kind === 'song' ? r.artistName ?? '' : kind === 'movie' ? [r.releaseDate?.slice(0, 4), r.primaryGenreName].filter(Boolean).join(' · ') : r.primaryGenreName ?? 'TV show',
    ).trim();
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    const candidate = {
      kind,
      title: title.slice(0, 120),
      subtitle: subtitle.slice(0, 120),
      artworkUrl: typeof r.artworkUrl100 === 'string' ? r.artworkUrl100.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null,
      previewUrl: kind === 'song' && typeof r.previewUrl === 'string' ? r.previewUrl : null,
      link: (r.trackViewUrl ?? r.collectionViewUrl ?? null) as string | null,
    };
    const parsed = featuredSchema.safeParse(candidate);
    if (parsed.success) out.push(parsed.data);
    else out.push({ ...candidate, artworkUrl: null, previewUrl: null, link: null });
  }
  return out;
}
