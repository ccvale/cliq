// Append-only list of schema migrations. Never edit one that has shipped; add a new entry instead.
export const migrations: string[] = [
  `
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    password_hash TEXT,
    apple_sub TEXT UNIQUE,
    google_sub TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX users_email_idx ON users (lower(email));

  CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    birthday DATE,
    gender TEXT,
    gig_title TEXT NOT NULL DEFAULT '',
    gig_place TEXT NOT NULL DEFAULT '',
    interests TEXT[] NOT NULL DEFAULT '{}',
    palette TEXT[] NOT NULL DEFAULT '{iris,rose}',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    city TEXT NOT NULL DEFAULT '',
    age_min INT NOT NULL DEFAULT 18,
    age_max INT NOT NULL DEFAULT 99,
    max_distance_mi INT NOT NULL DEFAULT 25,
    onboarded BOOLEAN NOT NULL DEFAULT false,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
  );
  CREATE INDEX sessions_family_idx ON sessions (family_id);

  CREATE TABLE swipes (
    swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (swiper_id, target_id)
  );
  CREATE INDEX swipes_target_idx ON swipes (target_id) WHERE liked;

  CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    CHECK (user_a < user_b),
    UNIQUE (user_a, user_b)
  );

  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
  );
  CREATE INDEX messages_match_idx ON messages (match_id, created_at DESC);

  CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE push_tokens (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  `,
  `
  ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;

  CREATE TABLE email_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
    code_hash TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );
  CREATE INDEX email_codes_user_idx ON email_codes (user_id, purpose, created_at DESC);

  CREATE TABLE photos (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  `,
  `
  CREATE TABLE blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id)
  );
  CREATE INDEX blocks_blocked_idx ON blocks (blocked_id);
  INSERT INTO blocks (blocker_id, blocked_id) SELECT DISTINCT reporter_id, target_id FROM reports ON CONFLICT DO NOTHING;

  ALTER TABLE users ADD COLUMN notify_matches BOOLEAN NOT NULL DEFAULT true;
  ALTER TABLE users ADD COLUMN notify_messages BOOLEAN NOT NULL DEFAULT true;
  ALTER TABLE profiles ADD COLUMN snoozed_until TIMESTAMPTZ;
  `,
  // Hosts like Supabase also expose the public schema through their own REST API. Row level security with no
  // policies shuts that door; the Cliq API connects as the table owner, which RLS doesn't apply to.
  `
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
  ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
  ALTER TABLE email_codes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
  `,
  `
  ALTER TABLE email_codes DROP CONSTRAINT email_codes_purpose_check;
  ALTER TABLE email_codes ADD CONSTRAINT email_codes_purpose_check CHECK (purpose IN ('verify', 'reset', 'signin'));

  ALTER TABLE users ADD COLUMN totp_secret TEXT;
  ALTER TABLE users ADD COLUMN totp_pending_secret TEXT;
  ALTER TABLE users ADD COLUMN totp_enabled_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN totp_last_step BIGINT;

  CREATE TABLE backup_codes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, code_hash)
  );
  ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
  `,
  `
  ALTER TABLE profiles ADD COLUMN prompts JSONB NOT NULL DEFAULT '[]';
  ALTER TABLE profiles ADD COLUMN featured JSONB;
  ALTER TABLE users ADD COLUMN live_location BOOLEAN NOT NULL DEFAULT true;
  ALTER TABLE users ADD COLUMN show_activity BOOLEAN NOT NULL DEFAULT true;

  ALTER TABLE messages ADD COLUMN kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image', 'gif'));
  ALTER TABLE messages ADD COLUMN media JSONB;

  CREATE TABLE message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE message_media ENABLE ROW LEVEL SECURITY;
  `,
];
