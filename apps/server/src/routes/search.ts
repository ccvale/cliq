import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { validate as zValidator } from '../lib/validate.js';
import type { Db } from '../db.js';
import { config } from '../config.js';
import { rateLimit, requireAuth, type AuthEnv } from '../auth/middleware.js';
import { ageOn } from '../lib/age.js';

export type FeaturedDto = { kind: 'song' | 'movie' | 'show'; title: string; subtitle: string; artworkUrl: string | null; year: number | null };
export type GifDto = { id: string; url: string; width: number; height: number; preview: string };

/** Artwork and GIFs are only ever loaded from these hosts, so a profile or message can't point at a tracking pixel. */
export const ARTWORK_HOST = /^https:\/\/is\d+-ssl\.mzstatic\.com\//;
export const GIF_HOST = /^https:\/\/media\d*\.giphy\.com\//;

const ITUNES: Record<FeaturedDto['kind'], string> = {
  song: 'media=music&entity=song',
  movie: 'media=movie&entity=movie',
  // Shows come back one row per season; the show itself is the artist.
  show: 'media=tvShow&entity=tvSeason',
};

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!res?.ok) throw new HTTPException(502, { message: 'Search isn’t available right now' });
  return (await res.json()) as any;
}

export function searchRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  r.use('/search/*', requireAuth, rateLimit({ limit: 60, windowMs: 60_000, perUser: true }));

  // Songs, movies and shows from the iTunes Search API, which needs no key.
  r.get(
    '/search/featured',
    zValidator('query', z.object({ kind: z.enum(['song', 'movie', 'show']), q: z.string().trim().min(1).max(80) })),
    async (c) => {
      const { kind, q } = c.req.valid('query');
      const json = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&${ITUNES[kind]}&limit=15&country=US`);
      const seen = new Set<string>();
      const results: FeaturedDto[] = [];
      for (const item of json.results ?? []) {
        const title = kind === 'show' ? item.artistName : item.trackName;
        if (!title || seen.has(title)) continue;
        seen.add(title);
        const art = typeof item.artworkUrl100 === 'string' ? item.artworkUrl100.replace('100x100bb', '300x300bb') : null;
        results.push({
          kind,
          title: String(title).slice(0, 80),
          subtitle: String(kind === 'song' ? item.artistName : kind === 'movie' ? item.primaryGenreName ?? '' : item.primaryGenreName ?? '').slice(0, 80),
          artworkUrl: art && ARTWORK_HOST.test(art) ? art : null,
          year: item.releaseDate ? new Date(item.releaseDate).getUTCFullYear() : null,
        });
      }
      return c.json({ results: results.slice(0, 10) });
    },
  );

  r.get('/search/gifs/enabled', (c) => c.json({ enabled: Boolean(config.giphyApiKey) }));

  // GIFs from GIPHY. Teens get G-rated results only.
  r.get('/search/gifs', zValidator('query', z.object({ q: z.string().trim().max(50).optional() })), async (c) => {
    if (!config.giphyApiKey) throw new HTTPException(404, { message: 'GIF search isn’t set up' });
    const me = await db.one<{ birthday: string | null }>('SELECT birthday FROM profiles WHERE user_id = $1', [c.var.userId]);
    const rating = me?.birthday && ageOn(me.birthday) >= 18 ? 'pg-13' : 'g';
    const q = c.req.valid('query').q;
    const base = 'https://api.giphy.com/v1/gifs';
    const params = `api_key=${config.giphyApiKey}&limit=24&rating=${rating}`;
    const json = await fetchJson(q ? `${base}/search?${params}&q=${encodeURIComponent(q)}` : `${base}/trending?${params}`);
    const gifs: GifDto[] = [];
    for (const g of json.data ?? []) {
      const full = g.images?.fixed_width;
      const small = g.images?.fixed_width_small ?? full;
      if (!full?.url || !GIF_HOST.test(full.url)) continue;
      gifs.push({ id: g.id, url: full.url, width: Number(full.width), height: Number(full.height), preview: small.url });
    }
    return c.json({ gifs });
  });

  return r;
}
