// Mirrors apps/server/src/lib/catalog.ts — keep the ids in sync.
export type PaletteId =
  | 'iris' | 'violet' | 'orchid' | 'rose' | 'coral' | 'apricot' | 'honey'
  | 'sage' | 'jade' | 'lagoon' | 'sky' | 'denim' | 'slate' | 'sand';

/** Each palette color has a bright tone for gradients and a deep tone for text and icons on light surfaces. */
export const PALETTE: Record<PaletteId, { name: string; tone: string; deep: string }> = {
  iris: { name: 'Iris', tone: '#7B6CFF', deep: '#4B3FD1' },
  violet: { name: 'Violet', tone: '#A27BF6', deep: '#6D3FD8' },
  orchid: { name: 'Orchid', tone: '#E07BE0', deep: '#A23AA6' },
  rose: { name: 'Rose', tone: '#FF6F91', deep: '#C92F57' },
  coral: { name: 'Coral', tone: '#FF8A65', deep: '#C9502C' },
  apricot: { name: 'Apricot', tone: '#FFB877', deep: '#B86A1F' },
  honey: { name: 'Honey', tone: '#F7CF5C', deep: '#9C7A0E' },
  sage: { name: 'Sage', tone: '#A8CDA0', deep: '#4D7A45' },
  jade: { name: 'Jade', tone: '#3CC5A3', deep: '#16806A' },
  lagoon: { name: 'Lagoon', tone: '#38B6D8', deep: '#16728C' },
  sky: { name: 'Sky', tone: '#8DCBFF', deep: '#2D78BC' },
  denim: { name: 'Denim', tone: '#5B7FE6', deep: '#2F4DB0' },
  slate: { name: 'Slate', tone: '#8A97AD', deep: '#47536A' },
  sand: { name: 'Sand', tone: '#E3CBA8', deep: '#8C6B3D' },
};
export const PALETTE_IDS = Object.keys(PALETTE) as PaletteId[];

export const INTERESTS: Record<string, string> = {
  Basketball: '🏀', Soccer: '⚽️', Running: '🏃', Hiking: '🥾', Climbing: '🧗', Cycling: '🚴', Yoga: '🧘', Lifting: '🏋️',
  Skating: '🛹', Surfing: '🏄', Snowboarding: '🏂', Dancing: '💃', Cooking: '🍳', Baking: '🥐', Coffee: '☕️', Gardening: '🪴',
  Painting: '🎨', Photography: '📷', Film: '🎬', Anime: '🌸', Reading: '📚', Writing: '✍️', Poetry: '🪶', Music: '🎧',
  Concerts: '🎤', Guitar: '🎸', Piano: '🎹', Singing: '🎙️', 'Video games': '🎮', 'Board games': '🎲', Chess: '♟️', Coding: '💻',
  Travel: '✈️', Thrifting: '🧥', Fashion: '👟', Pets: '🐶', Volunteering: '🤝', Podcasts: '🎙', Theater: '🎭', Comedy: '😂',
};
export const INTEREST_NAMES = Object.keys(INTERESTS);
export const MAX_INTERESTS = 5;

// Mirrors PROMPTS in apps/server/src/lib/catalog.ts — keep the ids in sync.
export const PROMPTS: Record<string, string> = {
  'perfect-saturday': 'My perfect Saturday',
  'talk-for-hours': 'I could talk for hours about',
  'teach-you': 'I can teach you how to',
  'looking-for': 'Looking for someone to',
  'hot-take': 'My most controversial opinion',
  'comfort-food': 'Go-to comfort food',
  'last-obsession': 'My latest obsession',
  'hidden-talent': 'A hidden talent of mine',
  'green-flag': 'Green flag in a friend',
  'first-hang': 'Ideal first hangout',
};
export const MAX_PROMPTS = 3;

// Mirrors BADGE_IDS in apps/server/src/lib/achievements.ts — keep the ids in sync.
export const BADGES: Record<string, { name: string; emoji: string; how: string }> = {
  verified: { name: 'Verified', emoji: '✅', how: 'Confirm your email address' },
  'first-match': { name: 'First Click', emoji: '✨', how: 'Make your first match' },
  'first-message': { name: 'Icebreaker', emoji: '💬', how: 'Send your first message' },
  'first-block': { name: 'Boundaries', emoji: '🛡️', how: 'Block someone for the first time' },
  'all-about-me': { name: 'All About Me', emoji: '🪞', how: 'Add a photo, a bio and a prompt' },
  tastemaker: { name: 'Tastemaker', emoji: '🎧', how: 'Feature a song, movie or show' },
  explorer: { name: 'Explorer', emoji: '🧭', how: 'Swipe on 50 people' },
  'social-butterfly': { name: 'Social Butterfly', emoji: '🦋', how: 'Make 5 friends' },
  chatterbox: { name: 'Chatterbox', emoji: '🗣️', how: 'Send 100 messages' },
};

export const FEATURED_KINDS = { song: 'Song', movie: 'Movie', show: 'Show' } as const;
