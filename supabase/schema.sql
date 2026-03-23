-- ─────────────────────────────────────────────────────────────
-- Commune — Supabase schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────

-- ── 1. profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL DEFAULT '',
  area          text NOT NULL DEFAULT '',
  city          text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  avatar_url    text,
  rating_sum    int  NOT NULL DEFAULT 0,
  rating_count  int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, area, city, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text NOT NULL,
  brand       text,
  condition   text NOT NULL,
  description text NOT NULL DEFAULT '',
  points      int  NOT NULL,
  status      text NOT NULL DEFAULT 'Available',
  photos      text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. item_likes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id)
);

-- ── 4. member_follows ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- ── 5. wanted_items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wanted_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  category   text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 6. swaps ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swaps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id  uuid NOT NULL REFERENCES profiles(id),
  receiver_id  uuid NOT NULL REFERENCES profiles(id),
  status       text NOT NULL DEFAULT 'Proposed',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 7. swap_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swap_items (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id  uuid NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  item_id  uuid NOT NULL REFERENCES items(id),
  side     text NOT NULL  -- 'proposer' | 'receiver'
);

-- ── 8. conversations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member1_id      uuid NOT NULL REFERENCES profiles(id),
  member2_id      uuid NOT NULL REFERENCES profiles(id),
  swap_id         uuid REFERENCES swaps(id),
  last_message    text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 9. messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES profiles(id),
  content         text NOT NULL,
  type            text NOT NULL DEFAULT 'text',  -- 'text' | 'date_suggestion' | 'date_confirmed'
  suggested_date  date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 10. scheduled_swaps ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_swaps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id        uuid NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  status         text NOT NULL DEFAULT 'Confirmed',  -- 'Confirmed' | 'Completed'
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 11. ratings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id    uuid NOT NULL REFERENCES swaps(id),
  rater_id   uuid NOT NULL REFERENCES profiles(id),
  rated_id   uuid NOT NULL REFERENCES profiles(id),
  score      int  NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swap_id, rater_id)
);

-- Recalculate rating_sum / rating_count on profiles whenever a rating is inserted
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET
    rating_sum   = (SELECT COALESCE(SUM(score), 0) FROM ratings WHERE rated_id = NEW.rated_id),
    rating_count = (SELECT COUNT(*)                FROM ratings WHERE rated_id = NEW.rated_id)
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_rating_inserted ON ratings;
CREATE TRIGGER on_rating_inserted
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_follows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings         ENABLE ROW LEVEL SECURITY;

-- profiles: anyone authenticated can read; only owner can update
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- items: anyone (even anon) can read available items; only owner can write
CREATE POLICY "items_select"    ON items FOR SELECT USING (true);
CREATE POLICY "items_insert"    ON items FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "items_update"    ON items FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "items_delete"    ON items FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- item_likes
CREATE POLICY "item_likes_select" ON item_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_likes_insert" ON item_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "item_likes_delete" ON item_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- member_follows
CREATE POLICY "follows_select" ON member_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert" ON member_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON member_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- wanted_items
CREATE POLICY "wanted_select" ON wanted_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "wanted_insert" ON wanted_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wanted_delete" ON wanted_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- swaps: participants can see their swaps
CREATE POLICY "swaps_select" ON swaps FOR SELECT TO authenticated
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "swaps_insert" ON swaps FOR INSERT TO authenticated WITH CHECK (proposer_id = auth.uid());
CREATE POLICY "swaps_update" ON swaps FOR UPDATE TO authenticated
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid());

-- swap_items
CREATE POLICY "swap_items_select" ON swap_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "swap_items_insert" ON swap_items FOR INSERT TO authenticated WITH CHECK (true);

-- conversations: participants can see their conversations
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (member1_id = auth.uid() OR member2_id = auth.uid());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (member1_id = auth.uid() OR member2_id = auth.uid());
CREATE POLICY "conversations_update" ON conversations FOR UPDATE TO authenticated
  USING (member1_id = auth.uid() OR member2_id = auth.uid());

-- messages
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE member1_id = auth.uid() OR member2_id = auth.uid()
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- scheduled_swaps
CREATE POLICY "scheduled_swaps_select" ON scheduled_swaps FOR SELECT TO authenticated USING (
  swap_id IN (SELECT id FROM swaps WHERE proposer_id = auth.uid() OR receiver_id = auth.uid())
);
CREATE POLICY "scheduled_swaps_insert" ON scheduled_swaps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduled_swaps_update" ON scheduled_swaps FOR UPDATE TO authenticated USING (true);

-- ratings
CREATE POLICY "ratings_select" ON ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings_insert" ON ratings FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());

-- ── Storage bucket for item photos ────────────────────────────
-- Run this separately or via Storage UI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', true);
-- CREATE POLICY "item_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'item-photos');
-- CREATE POLICY "item_photos_insert" ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
