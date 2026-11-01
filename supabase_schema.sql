-- Supabase Schema for Attendance-Linked Incentive Program
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Users table (stores wallet address, off-chain profile and role)
CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    name TEXT,
    roll_no TEXT,
    department TEXT DEFAULT 'Computer Science & Engineering',
    semester TEXT DEFAULT 'Semester 6',
    role TEXT NOT NULL DEFAULT 'none' CHECK (role IN ('admin', 'teacher', 'student', 'none')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Sessions table (stores classroom sessions)
CREATE TABLE IF NOT EXISTS sessions (
    session_id INTEGER PRIMARY KEY,
    subject TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by TEXT NOT NULL,
    tx_hash TEXT
);

-- 3. Attendance table (records attendance per session)
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id INTEGER NOT NULL,
    student TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    tx_hash TEXT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_session_student UNIQUE (session_id, student)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance (student);

-- 4. Rewards table (records claimed on-chain rewards)
CREATE TABLE IF NOT EXISTS rewards (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student TEXT NOT NULL,
    percent INTEGER NOT NULL,
    amount_wei TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rewards_student ON rewards (student);

-- Enable RLS and add open policies for backend API access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to sessions" ON sessions;
CREATE POLICY "Allow all access to sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to attendance" ON attendance;
CREATE POLICY "Allow all access to attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to rewards" ON rewards;
CREATE POLICY "Allow all access to rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);

