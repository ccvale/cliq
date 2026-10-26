/**
 * In-browser stand-in for the Cliq API, used when EXPO_PUBLIC_DEMO=1. It lets the web build run as a
 * self-contained demo with seeded people, mutual likes and friends who write back.
 */
import type { Achievement, BlockedPerson, Card, Featured, FeaturedKind, Media, MatchSummary, Me, Message, Profile, ProfilePatch, ServerEvent, Settings } from './types';
import { ACHIEVEMENTS } from './achievements';

type Person = Omit<Card, 'sharedInterests' | 'distance' | 'photoUrl' | 'prompts' | 'featured' | 'badges'> &
  Partial<Pick<Card, 'prompts' | 'featured' | 'badges'>> & { miles: number; likesYou: boolean; replies: string[] };

const fav = (kind: FeaturedKind, title: string, subtitle: string): Featured => ({ kind, title, subtitle, artworkUrl: null, previewUrl: null, link: null });

const people: Person[] = [
  { id: 'maya', displayName: 'Maya', age: 23, gigTitle: 'Barista', gigPlace: 'Ramapo College', bio: 'Latte art in progress. Looking for a hiking buddy who doesn’t mind early starts.', interests: ['Hiking', 'Coffee', 'Photography', 'Film'], palette: ['apricot', 'rose'], city: 'Mahwah, NJ', prompts: [{ question: 'My ideal Saturday', answer: 'Sunrise hike at Ramapo Reservation, then pancakes. In that order.' }, { question: 'Teach me how to', answer: 'Develop film at home. I have the chemicals, just not the courage.' }], featured: fav('song', 'Dreams', 'Fleetwood Mac'), badges: ['open-book', 'first-click', 'verified'], miles: 2, likesYou: true, replies: ['Hi!! Okay I’m so glad you swiped 😄', 'Have you done the Ramapo Reservation loop? Sunrise there is unreal', 'I’m free Sunday morning if you want to try it'] },
  { id: 'jordan', displayName: 'Jordan', age: 25, gigTitle: 'Software engineer', gigPlace: 'Prudential', bio: 'Board game collection is getting out of hand. Need people to play them with.', interests: ['Board games', 'Coding', 'Cooking', 'Chess'], palette: ['jade', 'lagoon'], city: 'Ramsey, NJ', prompts: [{ question: 'A hill I will die on', answer: 'Catan is better with five players.' }], featured: fav('show', 'The Bear', 'Comedy'), badges: ['inner-circle', 'deep-talk', 'icebreaker', 'verified'], miles: 4, likesYou: true, replies: ['Hey! Fellow coder 👋', 'Game night is Thursdays at my place, there’s always room for one more', 'Do you know Wingspan? It’s my current obsession'] },
  { id: 'priya', displayName: 'Priya', age: 22, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'Nursing student who runs to stay sane. Always down for a farmers market.', interests: ['Running', 'Baking', 'Podcasts', 'Gardening'], palette: ['orchid', 'iris'], city: 'Mahwah, NJ', miles: 1, likesYou: false, replies: [] },
  { id: 'theo', displayName: 'Theo', age: 27, gigTitle: 'Line cook', gigPlace: 'The Grand Café', bio: 'I will feed you. In exchange, come to a show with me.', interests: ['Cooking', 'Concerts', 'Guitar', 'Skating'], palette: ['coral', 'honey'], city: 'Suffern, NY', prompts: [{ question: 'Let’s get together and', answer: 'Find the best taco truck in Rockland County.' }], featured: fav('song', 'Kids', 'MGMT'), badges: ['icebreaker', 'verified'], miles: 6, likesYou: true, replies: ['Yo! What kind of music are you into?', 'There’s a great indie show at the Fillmore next month'] },
  { id: 'sam', displayName: 'Sam', age: 24, gigTitle: 'Graphic designer', gigPlace: 'Freelance', bio: 'Thrifting on weekends, sketching on weekdays. Let’s go to a museum.', interests: ['Painting', 'Thrifting', 'Fashion', 'Photography'], palette: ['violet', 'rose'], city: 'Ridgewood, NJ', miles: 9, likesYou: false, replies: [] },
  { id: 'alex', displayName: 'Alex', age: 26, gigTitle: 'Physical therapist', gigPlace: 'Valley Hospital', bio: 'Climbing gym regular. I can teach you to belay.', interests: ['Climbing', 'Yoga', 'Hiking', 'Travel'], palette: ['sage', 'jade'], city: 'Paramus, NJ', miles: 12, likesYou: false, replies: [] },
  { id: 'riley', displayName: 'Riley', age: 21, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'New to the area and looking for a crew for trivia night.', interests: ['Comedy', 'Video games', 'Anime', 'Music'], palette: ['sky', 'iris'], city: 'Mahwah, NJ', prompts: [{ question: 'I’ll know we’ll click if', answer: 'You laugh at my trivia team name.' }, { question: 'Currently obsessed with', answer: 'Rhythm games and cold brew.' }], featured: fav('movie', 'Spirited Away', '2001 · Anime'), badges: ['explorer', 'verified'], miles: 1, likesYou: true, replies: ['Heyyy trivia crew recruit 🧠', 'We go every Wednesday at the brewery on Route 17'] },
  { id: 'nina', displayName: 'Nina', age: 28, gigTitle: 'Teacher', gigPlace: 'Ramsey High', bio: 'Book club founder. We read, we eat, we gossip about fictional people.', interests: ['Reading', 'Writing', 'Baking', 'Theater'], palette: ['rose', 'apricot'], city: 'Ramsey, NJ', miles: 4, likesYou: false, replies: [] },
  { id: 'diego', displayName: 'Diego', age: 25, gigTitle: 'Data analyst', gigPlace: 'BMW of North America', bio: 'Pickup soccer Sundays. All skill levels, mostly mine.', interests: ['Soccer', 'Coding', 'Travel', 'Film'], palette: ['lagoon', 'sky'], city: 'Woodcliff Lake, NJ', prompts: [{ question: 'I’m weirdly good at', answer: 'Guessing how long a commute will take, to the minute.' }], featured: fav('movie', 'Inception', '2010 · Sci-Fi'), badges: ['first-click', 'verified'], miles: 7, likesYou: true, replies: ['Welcome to the squad ⚽️', 'We play at 10 on Sundays, bring water'] },
  { id: 'hana', displayName: 'Hana', age: 22, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'Snowboarding in winter, surfing in summer, complaining about both.', interests: ['Snowboarding', 'Surfing', 'Photography', 'Travel'], palette: ['sky', 'lagoon'], city: 'Mahwah, NJ', miles: 2, likesYou: false, replies: [] },
];
const ava: Person = { id: 'ava', displayName: 'Ava', age: 24, gigTitle: 'UX researcher', gigPlace: 'Remote', bio: 'Coffee snob, film nerd.', interests: ['Coffee', 'Film', 'Reading'], palette: ['rose', 'coral'], city: 'Ramsey, NJ', badges: ['deep-talk', 'first-click', 'verified'], featured: fav('movie', 'Past Lives', '2023 · Drama'), miles: 2, likesYou: true, replies: ['Perfect, there’s a café called Sweet Grass right next door', 'Meet there at 1?'] };

const ME_ID = 'me';
const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

const blankProfile = (): Profile => ({
  displayName: '', bio: '', birthday: null, age: null, gender: null, gigTitle: '', gigPlace: '', interests: [],
  palette: ['iris', 'rose'], city: '', hasLocation: false, ageMin: 18, ageMax: 99, maxDistanceMi: 25, onboarded: false, photoUrl: null,
  prompts: [], featured: null,
});

const demoProfile = (): Profile => ({
  displayName: 'Chris', bio: 'Built the first Cliq for my senior project. Now I’m looking for people to grab coffee with.',
  birthday: '2001-05-14', age: 23, gender: 'unspecified', gigTitle: 'Developer', gigPlace: 'Ramapo College',
  interests: ['Coding', 'Coffee', 'Hiking', 'Video games', 'Film'], palette: ['iris', 'orchid'], city: 'Mahwah, NJ',
  hasLocation: true, ageMin: 18, ageMax: 40, maxDistanceMi: 25, onboarded: true, photoUrl: null,
  prompts: [{ question: 'Ask me about', answer: 'The first version of this app, which I built for my senior project.' }],
  featured: fav('show', 'Severance', 'Drama'),
});

/** The demo can't send email, so every code is this one (the screens say so). */
export const DEMO_CODE = '246810';

const state = {
  profile: blankProfile(),
  email: '',
  verified: true,
  settings: { notifyMatches: true, notifyMessages: true, liveLocation: true, showActivity: true, snoozedUntil: null } as Settings,
  blocked: [] as BlockedPerson[],
  lastSwipe: null as string | null,
  twoFactor: false,
  swiped: new Set<string>(),
  liked: 0,
  matches: [] as { id: string; person: Person; matchedAt: string; replyIndex: number }[],
  messages: new Map<string, Message[]>(),
  online: new Set<string>(),
};

let emit: (event: ServerEvent) => void = () => {};
export const onDemoEvent = (fn: (event: ServerEvent) => void) => (emit = fn);

function reset(profile: Profile, email: string, verified = true) {
  state.profile = profile;
  state.email = email;
  state.verified = verified;
  state.settings = { notifyMatches: true, notifyMessages: true, liveLocation: true, showActivity: true, snoozedUntil: null };
  state.online = new Set(['ava']);
  state.blocked = [];
  state.lastSwipe = null;
  state.swiped = new Set();
  state.liked = 0;
  state.matches = [{ id: 'm-ava', person: ava, matchedAt: ago(60 * 26), replyIndex: 0 }];
  state.messages = new Map([
    ['m-ava', [
      { id: 'a1', matchId: 'm-ava', senderId: 'ava', kind: 'text', media: null, body: 'Okay your bio said coffee and film. Have you been to the Lafayette Theater yet?', createdAt: ago(60 * 25), readAt: ago(60 * 24) },
      { id: 'a2', matchId: 'm-ava', senderId: ME_ID, kind: 'text', media: null, body: 'Not yet! I keep meaning to. Are they still doing the Saturday matinees?', createdAt: ago(60 * 24), readAt: ago(60 * 23) },
      { id: 'a3', matchId: 'm-ava', senderId: 'ava', kind: 'text', media: null, body: 'Every Saturday. Want to go this weekend? 🎬', createdAt: ago(12), readAt: null },
    ]],
  ]);
}

const tokens = () => ({ accessToken: 'demo', refreshToken: 'demo', expiresIn: 3600 });
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const fail = (message: string) => Object.assign(new Error(message), { status: 400 });

function toCard(p: Person): Card {
  const mine = new Set(state.profile.interests);
  return {
    id: p.id, displayName: p.displayName, age: p.age, bio: p.bio, gigTitle: p.gigTitle, gigPlace: p.gigPlace,
    interests: p.interests, sharedInterests: p.interests.filter((i) => mine.has(i)), palette: p.palette, city: p.city,
    distance: p.miles < 1 ? 'Under a mile away' : `${p.miles} mi away`, photoUrl: null,
    prompts: p.prompts ?? [], featured: p.featured ?? null, badges: p.badges ?? [],
  };
}

function summary(m: (typeof state.matches)[number]): MatchSummary {
  const list = state.messages.get(m.id) ?? [];
  const last = list.at(-1);
  return {
    id: m.id,
    matchedAt: m.matchedAt,
    person: toCard(m.person),
    lastMessage: last ? { body: last.kind === 'image' ? '📷 Photo' : last.kind === 'gif' ? 'GIF' : last.body, fromMe: last.senderId === ME_ID, at: last.createdAt } : null,
    unread: list.filter((x) => x.senderId !== ME_ID && !x.readAt).length,
    online: state.online.has(m.person.id),
    lastActiveAt: state.online.has(m.person.id) ? new Date().toISOString() : ago(m.person.miles * 17),
  };
}

function push(matchId: string, senderId: string, body: string, kind: Message['kind'] = 'text', media: Media | null = null) {
  const message: Message = { id: Math.random().toString(36).slice(2), matchId, senderId, kind, body, media, createdAt: new Date().toISOString(), readAt: null };
  state.messages.set(matchId, [...(state.messages.get(matchId) ?? []), message]);
  emit({ type: 'message:new', message });
  return message;
}

/** Friends type for a moment and then answer, so the chat feels alive. */
function scheduleReply(matchId: string) {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m || m.replyIndex >= m.person.replies.length) return;
  const body = m.person.replies[m.replyIndex++]!;
  if (!state.online.has(m.person.id)) {
    state.online.add(m.person.id);
    setTimeout(() => emit({ type: 'presence', userId: m.person.id, online: true, lastActiveAt: new Date().toISOString() }), 600);
  }
  setTimeout(() => emit({ type: 'typing', matchId, userId: m.person.id }), 1200);
  setTimeout(() => push(matchId, m.person.id, body), 3200);
}

function scoreOf(p: Person) {
  const shared = toCard(p).sharedInterests.length;
  return (p.likesYou ? 50 : 0) + shared * 10 - p.miles;
}

export const demoApi = {
  async signUp(email: string, password: string) {
    await wait();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw fail('Enter a valid email address');
    if (password.length < 10) throw fail('Use at least 10 characters');
    reset(blankProfile(), email, false);
    state.twoFactor = false;
    return tokens();
  },
  async signIn(email: string, _password: string) {
    await wait();
    const keep = state.twoFactor;
    reset(demoProfile(), email || 'demo@cliq.app');
    state.twoFactor = keep;
    return keep ? { mfaRequired: true as const, mfaToken: 'demo' } : tokens();
  },
  async signInWithApple() {
    throw fail('Sign in with Apple works in the iOS app');
  },
  async sendSignInCode(_email: string) {
    await wait();
  },
  async signInWithCode(email: string, code: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right.');
    const keep = state.twoFactor;
    reset(demoProfile(), email || 'demo@cliq.app');
    state.twoFactor = keep;
    return keep ? { mfaRequired: true as const, mfaToken: 'demo' } : tokens();
  },
  async verifyTwoFactor(_token: string, code: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right');
    return tokens();
  },
  async twoFactorSetup() {
    await wait();
    const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    return { secret, uri: `otpauth://totp/Cliq:${encodeURIComponent(state.email)}?secret=${secret}&issuer=Cliq` };
  },
  async twoFactorEnable(code: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right. In the demo, use 246810.');
    state.twoFactor = true;
    return { backupCodes: ['k7d2-9xqm', 'p3vh-2rnc', 'w8jt-6fya', 'c4sz-mb7e', 'r2gx-5kdq', 'h9pn-t3wv', 'f6ub-8zej', 'y5qc-n2hs', 'd7mk-4rxa', 'u3we-9jpt'] };
  },
  async twoFactorDisable(code: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right');
    state.twoFactor = false;
  },
  async signInWithGoogle(_idToken: string) {
    throw fail('Google sign in needs the real API');
  },
  async sendVerification() {
    await wait();
  },
  async verifyEmail(code: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right.');
    state.verified = true;
  },
  async forgotPassword(_email: string) {
    await wait();
  },
  async resetPassword(email: string, code: string, password: string) {
    await wait();
    if (code !== DEMO_CODE) throw fail('That code isn’t right.');
    if (password.length < 10) throw fail('Use at least 10 characters');
    reset(demoProfile(), email);
    return tokens();
  },
  async uploadPhoto(photo: Blob) {
    await wait(400);
    // Inline the image so it survives in the single-file demo without a server.
    const photoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(fail('Couldn’t read that photo'));
      reader.readAsDataURL(photo);
    });
    state.profile = { ...state.profile, photoUrl };
    return { photoUrl };
  },
  async deletePhoto() {
    state.profile = { ...state.profile, photoUrl: null };
  },
  async signOut() {},
  async changePassword() {
    await wait();
  },
  async deleteAccount(_password?: string) {},

  async me(): Promise<Me> {
    return {
      id: ME_ID,
      email: state.email,
      hasPassword: true,
      linkedApple: false,
      linkedGoogle: false,
      emailVerified: state.verified,
      twoFactorEnabled: state.twoFactor,
      features: { gifs: false },
      settings: { ...state.settings },
      profile: { ...state.profile },
      stats: { likesSent: state.liked, swipes: state.swiped.size, matches: state.matches.length },
    };
  },
  async updateProfile(patch: ProfilePatch): Promise<Profile> {
    await wait(200);
    const p = { ...state.profile };
    if (patch.birthday) {
      const b = new Date(patch.birthday);
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
      if (age < 13) throw fail('You need to be at least 13 to use Cliq');
      p.birthday = patch.birthday;
      p.age = age;
      if (age < 18) Object.assign(p, { ageMin: 13, ageMax: 17 });
    }
    const { location, birthday, ...rest } = patch;
    Object.assign(p, rest);
    if (location) Object.assign(p, { city: location.city, hasLocation: true });
    p.onboarded = !!(p.displayName && p.birthday && p.hasLocation && p.interests.length);
    state.profile = p;
    return { ...p };
  },
  async registerPushToken() {},
  async achievements(): Promise<{ achievements: Achievement[] }> {
    const p = state.profile;
    const mine = [...state.messages.values()].flat().filter((m) => m.senderId === ME_ID);
    const longest = Math.max(0, ...[...state.messages.values()].map((l) => l.length));
    const progress: Record<string, number> = {
      'first-click': Math.min(state.matches.length, 1),
      icebreaker: Math.min(mine.length, 1),
      'open-book': (p.bio ? 1 : 0) + (p.prompts.length ? 1 : 0) + (p.photoUrl ? 1 : 0),
      explorer: Math.min(state.swiped.size, 50),
      'deep-talk': Math.min(longest, 25),
      'inner-circle': Math.min(state.matches.length, 5),
      verified: state.verified ? 1 : 0,
    };
    return {
      achievements: ACHIEVEMENTS.map((a) => ({
        id: a.id, title: a.title, description: a.description, target: a.target, progress: progress[a.id] ?? 0,
        earnedAt: (progress[a.id] ?? 0) >= a.target ? ago(30) : null,
      })),
    };
  },
  async searchFeatured(kind: FeaturedKind, q: string) {
    await wait(300);
    const catalog: Record<FeaturedKind, [string, string][]> = {
      song: [['Dreams', 'Fleetwood Mac'], ['Kids', 'MGMT'], ['Motion Sickness', 'Phoebe Bridgers'], ['Redbone', 'Childish Gambino'], ['Dancing Queen', 'ABBA'], ['Ivy', 'Frank Ocean'], ['Pink + White', 'Frank Ocean'], ['Electric Feel', 'MGMT']],
      show: [['The Bear', 'Comedy'], ['Severance', 'Drama'], ['The Office', 'Comedy'], ['Abbott Elementary', 'Comedy'], ['Succession', 'Drama'], ['Bluey', 'Kids']],
      movie: [['Spirited Away', '2001 · Anime'], ['Inception', '2010 · Sci-Fi'], ['Past Lives', '2023 · Drama'], ['Everything Everywhere All at Once', '2022 · Action'], ['The Grand Budapest Hotel', '2014 · Comedy'], ['Interstellar', '2014 · Sci-Fi']],
    };
    const term = q.trim().toLowerCase();
    return { results: catalog[kind].filter(([t, s]) => `${t} ${s}`.toLowerCase().includes(term)).map(([t, s]) => fav(kind, t, s)) };
  },
  async updateSettings(patch: { notifyMatches?: boolean; notifyMessages?: boolean; liveLocation?: boolean; showActivity?: boolean; snoozeDays?: number }) {
    const { snoozeDays, ...rest } = patch;
    Object.assign(state.settings, rest);
    if (snoozeDays !== undefined) {
      state.settings.snoozedUntil = snoozeDays ? new Date(Date.now() + snoozeDays * 86_400_000).toISOString() : null;
    }
  },
  async devices() {
    const now = new Date().toISOString();
    return {
      sessions: [
        { id: 'this', device: 'This browser', signedInAt: ago(5), lastSeenAt: now, current: true },
        { id: 'phone', device: 'iPhone · Cliq app', signedInAt: ago(60 * 24 * 3), lastSeenAt: ago(90), current: false },
      ],
    };
  },
  async signOutDevice(_id: string) {
    await wait();
  },
  async exportData() {
    return { exportedAt: new Date().toISOString(), account: { email: state.email }, profile: state.profile, matches: state.matches.length };
  },
  async blocked() {
    return { blocks: [...state.blocked] };
  },
  async block(id: string) {
    const m = state.matches.find((x) => x.person.id === id);
    const person = m?.person ?? people.find((x) => x.id === id);
    if (person) state.blocked.unshift({ id, displayName: person.displayName, palette: person.palette, photoUrl: null, blockedAt: new Date().toISOString() });
    if (m) await demoApi.unmatch(m.id);
  },
  async unblock(id: string) {
    state.blocked = state.blocked.filter((b) => b.id !== id);
  },
  async undoSwipe() {
    await wait(150);
    const id = state.lastSwipe;
    if (!id) throw fail('Nothing to undo');
    if (state.matches.some((m) => m.person.id === id)) throw fail('You already clicked with them, so that one stays');
    state.swiped.delete(id);
    state.lastSwipe = null;
    return { targetId: id };
  },

  async discover() {
    await wait(300);
    const p = state.profile;
    if (!p.onboarded) return { cards: [], reason: 'finish-profile' };
    // The demo people are all adults, so a teen profile sees an empty queue, just like the real API.
    const cards = people
      .filter((x) => !state.swiped.has(x.id) && !state.blocked.some((b) => b.id === x.id) && (p.age ?? 18) >= 18 && x.age >= p.ageMin && x.age <= p.ageMax && x.miles <= p.maxDistanceMi)
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .map(toCard);
    return { cards };
  },
  async swipe(targetId: string, liked: boolean) {
    await wait(150);
    if (!state.verified) throw Object.assign(fail('Confirm your email first'), { status: 403, code: 'verify-email' });
    state.swiped.add(targetId);
    state.lastSwipe = targetId;
    if (!liked) return { matchId: null };
    state.liked++;
    const person = people.find((x) => x.id === targetId);
    if (!person?.likesYou) return { matchId: null };
    const id = `m-${person.id}`;
    state.matches.unshift({ id, person, matchedAt: new Date().toISOString(), replyIndex: 0 });
    emit({ type: 'match:new', matchId: id, withUserId: person.id });
    return { matchId: id };
  },

  async matches() {
    await wait(150);
    return { matches: state.matches.map(summary).sort((a, b) => +new Date(b.lastMessage?.at ?? b.matchedAt) - +new Date(a.lastMessage?.at ?? a.matchedAt)) };
  },
  async messages(matchId: string, _before?: string) {
    await wait(150);
    return { messages: [...(state.messages.get(matchId) ?? [])], hasMore: false };
  },
  async send(matchId: string, body: string) {
    if (!state.verified) throw Object.assign(fail('Confirm your email first'), { status: 403, code: 'verify-email' });
    const message = push(matchId, ME_ID, body.trim());
    scheduleReply(matchId);
    return message;
  },
  async sendImage(matchId: string, image: Blob, width: number, height: number) {
    if (!state.verified) throw Object.assign(fail('Confirm your email first'), { status: 403, code: 'verify-email' });
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(fail('Couldn’t read that photo'));
      reader.readAsDataURL(image);
    });
    const message = push(matchId, ME_ID, '', image.type === 'image/gif' ? 'gif' : 'image', { url, width, height });
    scheduleReply(matchId);
    return message;
  },
  async sendGif(matchId: string, gif: Media) {
    return push(matchId, ME_ID, '', 'gif', { url: gif.url, width: gif.width, height: gif.height });
  },
  async searchGifs(_q: string) {
    return { gifs: [] };
  },
  async markRead(matchId: string) {
    const now = new Date().toISOString();
    state.messages.set(matchId, (state.messages.get(matchId) ?? []).map((m) => (m.senderId !== ME_ID && !m.readAt ? { ...m, readAt: now } : m)));
  },
  async unmatch(matchId: string) {
    state.matches = state.matches.filter((m) => m.id !== matchId);
    emit({ type: 'match:ended', matchId });
  },
  async report(targetId: string, _reason: string) {
    await demoApi.block(targetId);
  },
};
