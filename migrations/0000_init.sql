-- Migration: 0000_init.sql
-- Description: Create responses table for Japan Graduation Trip Survey

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  intent TEXT NOT NULL,
  days TEXT NOT NULL,
  style TEXT NOT NULL,
  transport TEXT NOT NULL,
  driver INTEGER NOT NULL DEFAULT 0,
  regions TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_intent ON responses(intent);
