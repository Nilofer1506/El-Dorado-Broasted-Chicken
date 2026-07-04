ALTER TABLE users ADD COLUMN phone TEXT;
CREATE UNIQUE INDEX idx_users_phone ON users(phone);

CREATE TABLE phone_otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
