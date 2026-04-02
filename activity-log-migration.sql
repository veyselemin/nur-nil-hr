-- ============================================================
-- NUR NIL TEKSTIL HR - Activity Log Migration
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- STEP 1: Create the activity_logs table
-- This records EVERY action every user takes in the system
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Enable Row Level Security on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin accounts can READ the activity log
CREATE POLICY "Only admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Any logged-in user can INSERT a log entry (needed for logging from all pages)
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- NOBODY can update or delete log entries (permanent record)
-- (No UPDATE or DELETE policies = no access)

-- STEP 3: Add soft-delete columns to the documents table
-- "Soft delete" means the file is NEVER truly erased - just hidden from regular users
-- Admins can still see it, restore it, or download it
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;

-- STEP 4: Add soft-delete columns to the employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_by_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_snapshot JSONB;

-- STEP 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted ON employees(is_deleted);

-- DONE! Your activity logging system is ready.
-- Now run the updated code files to start tracking all user actions.
