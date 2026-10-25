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
};

export type Me = {
  id: string;
  email: string | null;
  hasPassword: boolean;
  linkedApple: boolean;
  profile: Profile;
  stats: { likesSent: number; swipes: number; matches: number };
};

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
  Omit<Profile, 'age' | 'city' | 'hasLocation' | 'onboarded' | 'gender'> & {
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
