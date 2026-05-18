-- ─────────────────────────────────────────────────────────────
-- Credits system migration
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Add credits, referral_code, and referred_by to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits       INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS referral_code TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID    REFERENCES profiles(id);

-- 2. Set all existing users to 50 credits
UPDATE profiles SET credits = 50;

-- 3. Generate deterministic referral codes for all existing users
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::TEXT), 1, 8))
WHERE referral_code IS NULL;

-- 4. Trigger: auto-set referral_code on new profile insert
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_referral_code ON profiles;
CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- 5. credit_transactions — audit log of every credit change
CREATE TABLE IF NOT EXISTS credit_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     INTEGER     NOT NULL,
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Helper RPC: atomically add/subtract credits
CREATE OR REPLACE FUNCTION increment_credits(uid UUID, delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET credits = credits + delta WHERE id = uid;
END;
$$;

-- 6. credit_redemptions — records of credits spent on rewards
CREATE TABLE IF NOT EXISTS credit_redemptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL, -- 'bosta' | 'subscription_discount'
  credits    INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
