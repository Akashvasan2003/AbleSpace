-- Migration: add_project_fields_and_user_profile
-- Run this against your PostgreSQL database: psql -d ablespace -f migrate.sql

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "status"   TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "dueDate"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "leadId"   TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "title"    TEXT,
  ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Unique index on username (nullable, so only non-null values are unique)
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username") WHERE "username" IS NOT NULL;

-- Foreign key from Project.leadId -> User.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Project_leadId_fkey'
  ) THEN
    ALTER TABLE "Project"
      ADD CONSTRAINT "Project_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
