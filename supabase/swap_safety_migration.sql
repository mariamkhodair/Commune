-- ============================================================
-- Swap Safety System — run this in the Supabase SQL editor
-- ============================================================

-- 1. Departure / completion location session per user per swap
CREATE TABLE IF NOT EXISTS swap_safety_sessions (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id       uuid          NOT NULL REFERENCES swaps(id)    ON DELETE CASCADE,
  user_id       uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_lat double precision,
  departure_lng double precision,
  departed_at   timestamptz,
  completion_lat double precision,
  completion_lng double precision,
  completed_at  timestamptz,
  expires_at    timestamptz,  -- set to 24 h after departed_at; used by cleanup cron
  UNIQUE(swap_id, user_id)
);

-- 2. Row-level security
ALTER TABLE swap_safety_sessions ENABLE ROW LEVEL SECURITY;

-- Both swap participants can read either session row
CREATE POLICY "safety_session_select" ON swap_safety_sessions
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT proposer_id FROM swaps WHERE id = swap_id
      UNION
      SELECT receiver_id FROM swaps WHERE id = swap_id
    )
  );

-- Users can only insert / update their own session row
CREATE POLICY "safety_session_own_write" ON swap_safety_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 3. Track whether a user has ever accepted the location privacy notice
--    (one-time acceptance, shown before their very first "Off to Swap")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_privacy_accepted boolean NOT NULL DEFAULT false;
