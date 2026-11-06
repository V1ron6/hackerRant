-- Run once on an existing database (new tables are created by sequelize.sync on boot).
ALTER TABLE status_posts  ADD COLUMN IF NOT EXISTS visibility      VARCHAR(10) NOT NULL DEFAULT 'public';
ALTER TABLE messages      ADD COLUMN IF NOT EXISTS expires_at      TIMESTAMPTZ;
ALTER TABLE chats         ADD COLUMN IF NOT EXISTS disappear_after INTEGER;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS read_receipts   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS who_can_message VARCHAR(10) NOT NULL DEFAULT 'everyone';
CREATE INDEX IF NOT EXISTS messages_expires_at_idx ON messages (expires_at) WHERE expires_at IS NOT NULL;
