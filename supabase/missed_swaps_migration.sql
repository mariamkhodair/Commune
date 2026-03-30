-- Track when a "did your swap happen?" reminder was sent
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS missed_reminder_sent_at timestamptz;
