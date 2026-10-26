// Mirrored in apps/mobile/src/lib/catalog.ts — keep the ids in sync.
export const PALETTE_IDS = [
  'iris', 'violet', 'orchid', 'rose', 'coral', 'apricot', 'honey',
  'sage', 'jade', 'lagoon', 'sky', 'denim', 'slate', 'sand',
] as const;

export const INTERESTS = [
  'Basketball', 'Soccer', 'Running', 'Hiking', 'Climbing', 'Cycling', 'Yoga', 'Lifting',
  'Skating', 'Surfing', 'Snowboarding', 'Dancing', 'Cooking', 'Baking', 'Coffee', 'Gardening',
  'Painting', 'Photography', 'Film', 'Anime', 'Reading', 'Writing', 'Poetry', 'Music',
  'Concerts', 'Guitar', 'Piano', 'Singing', 'Video games', 'Board games', 'Chess', 'Coding',
  'Travel', 'Thrifting', 'Fashion', 'Pets', 'Volunteering', 'Podcasts', 'Theater', 'Comedy',
] as const;

export const GENDERS = ['woman', 'man', 'nonbinary', 'unspecified'] as const;

// Short questions people can answer on their card. Ids are stored, so never reuse or rename one.
export const PROMPTS = {
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
} as const;
export const PROMPT_IDS = Object.keys(PROMPTS) as (keyof typeof PROMPTS)[];

export const FEATURED_KINDS = ['song', 'movie', 'show'] as const;
