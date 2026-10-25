import { pathToFileURL } from 'node:url';
/**
 * Fills a local database with a demo account and people nearby, so the app has something to show.
 *   npm run seed                        # around Mahwah, NJ
 *   SEED_LAT=40.73 SEED_LNG=-73.99 npm run seed
 */
import { config } from './config.js';
import { openDb, type Db } from './db.js';
import { hashPassword } from './auth/password.js';

export const DEMO_EMAIL = 'demo@cliq.app';
export const DEMO_PASSWORD = 'cliq-demo-2024';

type Person = {
  name: string;
  age: number;
  title: string;
  place: string;
  bio: string;
  interests: string[];
  palette: [string, string];
  city: string;
  likesDemo?: boolean;
};

const people: Person[] = [
  { name: 'Maya', age: 23, title: 'Barista', place: 'Ramapo College', bio: 'Latte art in progress. Looking for a hiking buddy who doesn’t mind early starts.', interests: ['Hiking', 'Coffee', 'Photography', 'Film'], palette: ['apricot', 'rose'], city: 'Mahwah, NJ', likesDemo: true },
  { name: 'Jordan', age: 25, title: 'Software engineer', place: 'Prudential', bio: 'Board game collection is getting out of hand. Need people to play them with.', interests: ['Board games', 'Coding', 'Cooking', 'Chess'], palette: ['jade', 'lagoon'], city: 'Ramsey, NJ', likesDemo: true },
  { name: 'Priya', age: 22, title: 'Student', place: 'Ramapo College', bio: 'Nursing student who runs to stay sane. Always down for a farmers market.', interests: ['Running', 'Baking', 'Podcasts', 'Gardening'], palette: ['orchid', 'iris'], city: 'Mahwah, NJ' },
  { name: 'Theo', age: 27, title: 'Line cook', place: 'The Grand Café', bio: 'I will feed you. In exchange, come to a show with me.', interests: ['Cooking', 'Concerts', 'Guitar', 'Skating'], palette: ['coral', 'honey'], city: 'Suffern, NY', likesDemo: true },
  { name: 'Sam', age: 24, title: 'Graphic designer', place: 'Freelance', bio: 'Thrifting on weekends, sketching on weekdays. Let’s go to a museum.', interests: ['Painting', 'Thrifting', 'Fashion', 'Photography'], palette: ['violet', 'rose'], city: 'Ridgewood, NJ' },
  { name: 'Alex', age: 26, title: 'Physical therapist', place: 'Valley Hospital', bio: 'Climbing gym regular. I can teach you to belay.', interests: ['Climbing', 'Yoga', 'Hiking', 'Travel'], palette: ['sage', 'jade'], city: 'Paramus, NJ' },
  { name: 'Riley', age: 21, title: 'Student', place: 'Ramapo College', bio: 'New to the area and looking for a crew for trivia night.', interests: ['Comedy', 'Video games', 'Anime', 'Music'], palette: ['sky', 'iris'], city: 'Mahwah, NJ', likesDemo: true },
  { name: 'Nina', age: 28, title: 'Teacher', place: 'Ramsey High', bio: 'Book club founder. We read, we eat, we gossip about fictional people.', interests: ['Reading', 'Writing', 'Baking', 'Theater'], palette: ['rose', 'apricot'], city: 'Ramsey, NJ' },
  { name: 'Marcus', age: 24, title: 'Sound engineer', place: 'Studio B', bio: 'Vinyl, synths, and late-night diners.', interests: ['Music', 'Piano', 'Concerts', 'Podcasts'], palette: ['denim', 'slate'], city: 'Nyack, NY' },
  { name: 'Leah', age: 23, title: 'Vet tech', place: 'Mahwah Animal Hospital', bio: 'My dog needs friends and so do I.', interests: ['Pets', 'Hiking', 'Volunteering', 'Coffee'], palette: ['honey', 'sage'], city: 'Mahwah, NJ' },
  { name: 'Diego', age: 25, title: 'Data analyst', place: 'BMW of North America', bio: 'Pickup soccer Sundays. All skill levels, mostly mine.', interests: ['Soccer', 'Coding', 'Travel', 'Film'], palette: ['lagoon', 'sky'], city: 'Woodcliff Lake, NJ', likesDemo: true },
  { name: 'Hana', age: 22, title: 'Student', place: 'Ramapo College', bio: 'Snowboarding in winter, surfing in summer, complaining about both.', interests: ['Snowboarding', 'Surfing', 'Photography', 'Travel'], palette: ['sky', 'lagoon'], city: 'Mahwah, NJ' },
];

const birthdayFor = (age: number, i: number) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - age, d.getUTCMonth() - 1 - (i % 10), 1);
  return d.toISOString().slice(0, 10);
};

export async function seed(db: Db, center = { lat: 41.09, lng: -74.15 }) {
  const existing = await db.one('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  if (existing) return existing.id as string;

  const insert = async (email: string, p: Person, i: number, lat: number, lng: number) => {
    const u = await db.one<{ id: string }>('INSERT INTO users (email, password_hash, email_verified_at) VALUES ($1, $2, now()) RETURNING id', [
      email,
      await hashPassword(DEMO_PASSWORD),
    ]);
    await db.query(
      `INSERT INTO profiles (user_id, display_name, bio, birthday, gender, gig_title, gig_place, interests, palette, lat, lng, city, age_min, age_max, max_distance_mi, onboarded)
       VALUES ($1,$2,$3,$4,'unspecified',$5,$6,$7,$8,$9,$10,$11,18,40,40,true)`,
      [u!.id, p.name, p.bio, birthdayFor(p.age, i), p.title, p.place, p.interests, p.palette, lat, lng, p.city],
    );
    return u!.id;
  };

  const demo = await insert(
    DEMO_EMAIL,
    { name: 'Chris', age: 23, title: 'Developer', place: 'Ramapo College', bio: 'Built the first Cliq for my senior project. Now I’m looking for people to grab coffee with.', interests: ['Coding', 'Coffee', 'Hiking', 'Video games', 'Film'], palette: ['iris', 'orchid'], city: 'Mahwah, NJ' },
    0,
    center.lat,
    center.lng,
  );

  const ids: string[] = [];
  for (const [i, p] of people.entries()) {
    const jitter = (n: number) => ((Math.sin(i * 12.9898 + n) * 43758.5453) % 1) * 0.12;
    const id = await insert(`${p.name.toLowerCase()}@demo.cliq.app`, p, i + 1, center.lat + jitter(1), center.lng + jitter(2));
    ids.push(id);
    if (p.likesDemo) await db.query('INSERT INTO swipes (swiper_id, target_id, liked) VALUES ($1, $2, true)', [id, demo]);
  }

  // One existing friendship with a conversation, so the chat tab isn't empty on first launch.
  const friend = await insert('ava@demo.cliq.app', { name: 'Ava', age: 24, title: 'UX researcher', place: 'Remote', bio: 'Coffee snob, film nerd.', interests: ['Coffee', 'Film', 'Reading'], palette: ['rose', 'coral'], city: 'Ramsey, NJ' }, 20, center.lat + 0.03, center.lng - 0.02);
  const [a, b] = demo < friend ? [demo, friend] : [friend, demo];
  const match = await db.one<{ id: string }>('INSERT INTO matches (user_a, user_b) VALUES ($1, $2) RETURNING id', [a, b]);
  await db.query('INSERT INTO swipes (swiper_id, target_id, liked) VALUES ($1, $2, true), ($2, $1, true)', [demo, friend]);
  const lines: [string, string, number][] = [
    [friend, 'Okay your bio said coffee and film. Have you been to the Lafayette Theater yet?', 50],
    [demo, 'Not yet! I keep meaning to. Are they still doing the Saturday matinees?', 45],
    [friend, 'Every Saturday. There’s a great little café right next to it too ☕️', 40],
  ];
  for (const [sender, body, minsAgo] of lines) {
    await db.query(
      `INSERT INTO messages (match_id, sender_id, body, created_at, read_at) VALUES ($1, $2, $3, now() - make_interval(mins => $4), CASE WHEN $2::uuid = $5::uuid THEN NULL ELSE now() END)`,
      [match!.id, sender, body, minsAgo, friend],
    );
  }
  return demo;
}

// Compare as URLs so this also matches on Windows (file:///C:/...).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = await openDb({ url: config.databaseUrl, dataDir: config.dataDir });
  const center = { lat: Number(process.env.SEED_LAT ?? 41.09), lng: Number(process.env.SEED_LNG ?? -74.15) };
  await seed(db, center);
  console.log(`Seeded. Sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await db.close();
}
