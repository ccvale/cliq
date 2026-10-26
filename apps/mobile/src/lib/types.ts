export type Palette = [string, string];

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
};

export type Me = {
  id: string;
  email: string | null;
  hasPassword: boolean;
  linkedApple: boolean;
  linkedGoogle: boolean;
  emailVerified: boolean;
  profile: Profile;
  settings: Settings;
  stats: { likesSent: number; swipes: number; matches: number };
};

export type Settings = { notifyMatches: boolean; notifyMessages: boolean; snoozedUntil: string | null };

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
};

export type Message = { id: string; matchId: string; senderId: string; body: string; createdAt: string; readAt: string | null };

export type MatchSummary = {
  id: string;
  matchedAt: string;
  person: Card;
  lastMessage: { body: string; fromMe: boolean; at: string } | null;
  unread: number;
};

export type ProfilePatch = Partial<
  Omit<Profile, 'age' | 'city' | 'hasLocation' | 'onboarded' | 'gender' | 'photoUrl'> & {
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
  | { type: 'typing'; matchId: string; userId: string };
