-- Standalone SQL commands to remove influx_url column from organizations table
-- Run these commands in your SQLite database to apply the schema change

-- Step 1: Drop the influx_url column (SQLite 3.35.0+ required)
-- If you have an older SQLite version, use the alternative method below
ALTER TABLE organizations DROP COLUMN influx_url;

-- Alternative method for older SQLite versions (3.35.0 and below):
-- This recreates the table without the influx_url column

-- Step 1: Create backup table
-- CREATE TABLE organizations_backup AS SELECT * FROM organizations;

-- Step 2: Drop the original table
-- DROP TABLE organizations;

-- Step 3: Recreate table without influx_url column
-- CREATE TABLE organizations (
--   id           INTEGER PRIMARY KEY AUTOINCREMENT,
--   name         TEXT UNIQUE NOT NULL,
--   description  TEXT,
--   influx_token TEXT,
--   created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- Step 4: Copy data back (excluding influx_url)
-- INSERT INTO organizations (id, name, description, influx_token, created_at, updated_at)
-- SELECT id, name, description, influx_token, created_at, updated_at 
-- FROM organizations_backup;

-- Step 5: Drop backup table
-- DROP TABLE organizations_backup;

-- Verification: Check that the column has been removed
-- .schema organizations

-- Expected output should show organizations table without influx_url column:
-- CREATE TABLE organizations (
--   id           INTEGER PRIMARY KEY AUTOINCREMENT,
--   name         TEXT UNIQUE NOT NULL,
--   description  TEXT,
--   influx_token TEXT,
--   created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
-- );