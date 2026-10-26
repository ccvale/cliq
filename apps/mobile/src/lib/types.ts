export type Palette = [string, string];

export type PromptAnswer = { id: string; answer: string };

/** A song, movie or show someone features on their card. Artwork comes from iTunes search when picked there. */
export type Featured = { kind: 'song' | 'movie' | 'show'; title: string; subtitle: string; artworkUrl: string | null; year: number | null };

export type Gif = { id: string; url: string; width: number; height: number; preview: string };

export type Achievement = { id: string; earnedAt: string | null };

export type Profile = {
  displayName: string;
  bio: string;
  birthday: string | null;
  age: number | null;
  gender: 'woman' | 'man' | 'nonbinary' | 'unspecified' | null;
  gigTitle: string;
  gigPlace: string;
  interests: string[];
  palette: Palette;
  city: string;
  hasLocation: boolean;
  ageMin: number;
  ageMax: number;
  maxDistanceMi: number;
  onboarded: boolean;
  photoUrl: string | null;
  prompts: PromptAnswer[];
  featured: Featured | null;
  badges: string[];
};

export type Me = {
  id: string;
  email: string | null;
  hasPassword: boolean;
  linkedApple: boolean;
  linkedGoogle: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  profile: Profile;
  settings: Settings;
  stats: { likesSent: number; swipes: number; matches: number };
};

export type Tokens = { accessToken: string; refreshToken: string };
/** What a sign in returns: a session, or a challenge when two-step verification is on. */
export type AuthResult = Tokens | { mfaRequired: true; mfaToken: string };

export type Settings = { notifyMatches: boolean; notifyMessages: boolean; showOnline: boolean; snoozedUntil: string | null };

export type Device = { id: string; device: string; signedInAt: string; lastSeenAt: string; current: boolean };

export type BlockedPerson = { id: string; displayName: string; palette: Palette; photoUrl: string | null; blockedAt: string };

export type Card = {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  gigTitle: string;
  gigPlace: string;
  interests: string[];
  sharedInterests: string[];
  palette: Palette;
  city: string;
  distance: string;
  photoUrl: string | null;
  prompts: PromptAnswer[];
  featured: Featured | null;
  badges: string[];
};

export type Message = {
  id: string;
  matchId: string;
  senderId: string;
  kind: 'text' | 'image' | 'gif';
  body: string;
  /** Pictures and GIFs: where to load it from and the size to lay it out at before it arrives. */
  media: { url: string; width: number; height: number } | null;
  createdAt: string;
  readAt: string | null;
};

export type MatchSummary = {
  id: string;
  matchedAt: string;
  person: Card;
  lastMessage: { body: string; fromMe: boolean; at: string } | null;
  unread: number;
  online: boolean;
  /** Null when they've chosen to hide their online status. */
  lastActiveAt: string | null;
};

export type ProfilePatch = Partial<
  Omit<Profile, 'age' | 'city' | 'hasLocation' | 'onboarded' | 'gender' | 'photoUrl' | 'badges'> & {
    gender: Exclude<Profile['gender'], null>;
    location: { lat: number; lng: number; city: string };
  }
>;

export type ServerEvent =
  | { type: 'ready' | 'pong' }
  | { type: 'match:new'; matchId: string; withUserId: string }
  | { type: 'match:ended'; matchId: string }
  | { type: 'message:new'; message: Message }
  | { type: 'message:read'; matchId: string; readerId: string; at: string }
  | { type: 'typing'; matchId: string; userId: string }
  | { type: 'presence'; userId: string; online: boolean; at: string }
  | { type: 'achievement:new'; badge: string };
