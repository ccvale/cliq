/**
 * In-browser stand-in for the Cliq API, used when EXPO_PUBLIC_DEMO=1. It lets the web build run as a
 * self-contained demo with seeded people, mutual likes and friends who write back.
 */
import type { Card, MatchSummary, Me, Message, Profile, ProfilePatch, ServerEvent } from './types';

type Person = Omit<Card, 'sharedInterests' | 'distance'> & { miles: number; likesYou: boolean; replies: string[] };

const people: Person[] = [
  { id: 'maya', displayName: 'Maya', age: 23, gigTitle: 'Barista', gigPlace: 'Ramapo College', bio: 'Latte art in progress. Looking for a hiking buddy who doesn’t mind early starts.', interests: ['Hiking', 'Coffee', 'Photography', 'Film'], palette: ['apricot', 'rose'], city: 'Mahwah, NJ', miles: 2, likesYou: true, replies: ['Hi!! Okay I’m so glad you swiped 😄', 'Have you done the Ramapo Reservation loop? Sunrise there is unreal', 'I’m free Sunday morning if you want to try it'] },
  { id: 'jordan', displayName: 'Jordan', age: 25, gigTitle: 'Software engineer', gigPlace: 'Prudential', bio: 'Board game collection is getting out of hand. Need people to play them with.', interests: ['Board games', 'Coding', 'Cooking', 'Chess'], palette: ['jade', 'lagoon'], city: 'Ramsey, NJ', miles: 4, likesYou: true, replies: ['Hey! Fellow coder 👋', 'Game night is Thursdays at my place, there’s always room for one more', 'Do you know Wingspan? It’s my current obsession'] },
  { id: 'priya', displayName: 'Priya', age: 22, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'Nursing student who runs to stay sane. Always down for a farmers market.', interests: ['Running', 'Baking', 'Podcasts', 'Gardening'], palette: ['orchid', 'iris'], city: 'Mahwah, NJ', miles: 1, likesYou: false, replies: [] },
  { id: 'theo', displayName: 'Theo', age: 27, gigTitle: 'Line cook', gigPlace: 'The Grand Café', bio: 'I will feed you. In exchange, come to a show with me.', interests: ['Cooking', 'Concerts', 'Guitar', 'Skating'], palette: ['coral', 'honey'], city: 'Suffern, NY', miles: 6, likesYou: true, replies: ['Yo! What kind of music are you into?', 'There’s a great indie show at the Fillmore next month'] },
  { id: 'sam', displayName: 'Sam', age: 24, gigTitle: 'Graphic designer', gigPlace: 'Freelance', bio: 'Thrifting on weekends, sketching on weekdays. Let’s go to a museum.', interests: ['Painting', 'Thrifting', 'Fashion', 'Photography'], palette: ['violet', 'rose'], city: 'Ridgewood, NJ', miles: 9, likesYou: false, replies: [] },
  { id: 'alex', displayName: 'Alex', age: 26, gigTitle: 'Physical therapist', gigPlace: 'Valley Hospital', bio: 'Climbing gym regular. I can teach you to belay.', interests: ['Climbing', 'Yoga', 'Hiking', 'Travel'], palette: ['sage', 'jade'], city: 'Paramus, NJ', miles: 12, likesYou: false, replies: [] },
  { id: 'riley', displayName: 'Riley', age: 21, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'New to the area and looking for a crew for trivia night.', interests: ['Comedy', 'Video games', 'Anime', 'Music'], palette: ['sky', 'iris'], city: 'Mahwah, NJ', miles: 1, likesYou: true, replies: ['Heyyy trivia crew recruit 🧠', 'We go every Wednesday at the brewery on Route 17'] },
  { id: 'nina', displayName: 'Nina', age: 28, gigTitle: 'Teacher', gigPlace: 'Ramsey High', bio: 'Book club founder. We read, we eat, we gossip about fictional people.', interests: ['Reading', 'Writing', 'Baking', 'Theater'], palette: ['rose', 'apricot'], city: 'Ramsey, NJ', miles: 4, likesYou: false, replies: [] },
  { id: 'diego', displayName: 'Diego', age: 25, gigTitle: 'Data analyst', gigPlace: 'BMW of North America', bio: 'Pickup soccer Sundays. All skill levels, mostly mine.', interests: ['Soccer', 'Coding', 'Travel', 'Film'], palette: ['lagoon', 'sky'], city: 'Woodcliff Lake, NJ', miles: 7, likesYou: true, replies: ['Welcome to the squad ⚽️', 'We play at 10 on Sundays, bring water'] },
  { id: 'hana', displayName: 'Hana', age: 22, gigTitle: 'Student', gigPlace: 'Ramapo College', bio: 'Snowboarding in winter, surfing in summer, complaining about both.', interests: ['Snowboarding', 'Surfing', 'Photography', 'Travel'], palette: ['sky', 'lagoon'], city: 'Mahwah, NJ', miles: 2, likesYou: false, replies: [] },
];
const ava: Person = { id: 'ava', displayName: 'Ava', age: 24, gigTitle: 'UX researcher', gigPlace: 'Remote', bio: 'Coffee snob, film nerd.', interests: ['Coffee', 'Film', 'Reading'], palette: ['rose', 'coral'], city: 'Ramsey, NJ', miles: 2, likesYou: true, replies: ['Perfect, there’s a café called Sweet Grass right next door', 'Meet there at 1?'] };

const ME_ID = 'me';
const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

const blankProfile = (): Profile => ({
  displayName: '', bio: '', birthday: null, age: null, gender: null, gigTitle: '', gigPlace: '', interests: [],
  palette: ['iris', 'rose'], city: '', hasLocation: false, ageMin: 18, ageMax: 99, maxDistanceMi: 25, onboarded: false,
});

const demoProfile = (): Profile => ({
  displayName: 'Chris', bio: 'Built the first Cliq for my senior project. Now I’m looking for people to grab coffee with.',
  birthday: '2001-05-14', age: 23, gender: 'unspecified', gigTitle: 'Developer', gigPlace: 'Ramapo College',
  interests: ['Coding', 'Coffee', 'Hiking', 'Video games', 'Film'], palette: ['iris', 'orchid'], city: 'Mahwah, NJ',
  hasLocation: true, ageMin: 18, ageMax: 40, maxDistanceMi: 25, onboarded: true,
});

const state = {
  profile: blankProfile(),
  email: '',
  swiped: new Set<string>(),
  liked: 0,
  matches: [] as { id: string; person: Person; matchedAt: string; replyIndex: number }[],
  messages: new Map<string, Message[]>(),
};

let emit: (event: ServerEvent) => void = () => {};
export const onDemoEvent = (fn: (event: ServerEvent) => void) => (emit = fn);

function reset(profile: Profile, email: string) {
  state.profile = profile;
  state.email = email;
  state.swiped = new Set();
  state.liked = 0;
  state.matches = [{ id: 'm-ava', person: ava, matchedAt: ago(60 * 26), replyIndex: 0 }];
  state.messages = new Map([
    ['m-ava', [
      { id: 'a1', matchId: 'm-ava', senderId: 'ava', body: 'Okay your bio said coffee and film. Have you been to the Lafayette Theater yet?', createdAt: ago(60 * 25), readAt: ago(60 * 24) },
      { id: 'a2', matchId: 'm-ava', senderId: ME_ID, body: 'Not yet! I keep meaning to. Are they still doing the Saturday matinees?', createdAt: ago(60 * 24), readAt: ago(60 * 23) },
      { id: 'a3', matchId: 'm-ava', senderId: 'ava', body: 'Every Saturday. Want to go this weekend? 🎬', createdAt: ago(12), readAt: null },
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
    distance: p.miles < 1 ? 'Under a mile away' : `${p.miles} mi away`,
  };
}

function summary(m: (typeof state.matches)[number]): MatchSummary {
  const list = state.messages.get(m.id) ?? [];
  const last = list.at(-1);
  return {
    id: m.id,
    matchedAt: m.matchedAt,
    person: toCard(m.person),
    lastMessage: last ? { body: last.body, fromMe: last.senderId === ME_ID, at: last.createdAt } : null,
    unread: list.filter((x) => x.senderId !== ME_ID && !x.readAt).length,
  };
}

function push(matchId: string, senderId: string, body: string) {
  const message: Message = { id: Math.random().toString(36).slice(2), matchId, senderId, body, createdAt: new Date().toISOString(), readAt: null };
  state.messages.set(matchId, [...(state.messages.get(matchId) ?? []), message]);
  emit({ type: 'message:new', message });
  return message;
}

/** Friends type for a moment and then answer, so the chat feels alive. */
function scheduleReply(matchId: string) {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m || m.replyIndex >= m.person.replies.length) return;
  const body = m.person.replies[m.replyIndex++]!;
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
    reset(blankProfile(), email);
    return tokens();
  },
  async signIn(email: string, _password: string) {
    await wait();
    reset(demoProfile(), email || 'demo@cliq.app');
    return tokens();
  },
  async signInWithApple() {
    throw fail('Sign in with Apple works in the iOS app');
  },
  async signOut() {},
  async changePassword() {
    await wait();
  },
  async deleteAccount() {},

  async me(): Promise<Me> {
    return {
      id: ME_ID,
      email: state.email,
      hasPassword: true,
      linkedApple: false,
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

  async discover() {
    await wait(300);
    const p = state.profile;
    if (!p.onboarded) return { cards: [], reason: 'finish-profile' };
    // The demo people are all adults, so a teen profile sees an empty queue, just like the real API.
    const cards = people
      .filter((x) => !state.swiped.has(x.id) && (p.age ?? 18) >= 18 && x.age >= p.ageMin && x.age <= p.ageMax && x.miles <= p.maxDistanceMi)
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .map(toCard);
    return { cards };
  },
  async swipe(targetId: string, liked: boolean) {
    await wait(150);
    state.swiped.add(targetId);
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
    const message = push(matchId, ME_ID, body.trim());
    scheduleReply(matchId);
    return message;
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
    const m = state.matches.find((x) => x.person.id === targetId);
    if (m) await demoApi.unmatch(m.id);
  },
};
