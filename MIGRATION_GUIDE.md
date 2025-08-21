# Database Migration Guide - Phase 1 Enhancement

This guide explains how to migrate your existing Engesense Webapp database to the new Phase 1 enhanced schema with organizations and enhanced user management.

## ⚠️ Important: Backup Your Database First

Before running any migration, **always backup your existing database**:

```bash
# Backup your current database
cp data.sqlite data.sqlite.backup.$(date +%Y%m%d_%H%M%S)
```

## Option 1: Automated Migration (Recommended)

Use the provided migration script that safely updates your existing database:

```bash
# Run the automated migration script
node scripts/migrate.js
```

This script will:
- ✅ Create the new organizations table
- ✅ Add all new columns to your existing users table
- ✅ Create a default "Engesense" organization with your InfluxDB settings
- ✅ Update all existing users to reference the default organization
- ✅ Preserve all your existing user data (usernames, passwords, roles)
- ✅ Add default values for new fields (email, names, status)
- ✅ Verify the migration completed successfully

## Option 2: Manual Migration

If you prefer to run the migration manually, execute these SQL commands:

### Step 1: Create Organizations Table
```sql
CREATE TABLE IF NOT EXISTS organizations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT UNIQUE NOT NULL,
  description  TEXT,
  influx_url   TEXT,
  influx_token TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Insert Default Organization
```sql
INSERT INTO organizations (name, description, influx_url, influx_token) 
VALUES ('Engesense', 'Default Engesense Organization', 'your-influx-url', 'your-influx-token');
```

### Step 3: Add New Columns to Users Table
**Note**: SQLite doesn't support `CURRENT_TIMESTAMP` as default in `ALTER TABLE`, so timestamp columns are added without defaults and updated separately.

```sql
ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN status TEXT CHECK(status IN ('active','inactive','suspended')) DEFAULT 'active';
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN created_at DATETIME;
ALTER TABLE users ADD COLUMN updated_at DATETIME;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;
```

### Step 4: Update Existing Users with Timestamps
```sql
UPDATE users SET 
  organization_id = (SELECT id FROM organizations WHERE name = 'Engesense'),
  first_name = 'User',
  last_name = '',
  email = username || '@engesense.com',
  status = 'active',
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id IS NULL;
```

## After Migration

1. **Restart your application** to load the new schema
2. **Verify the migration** by visiting the admin users page at `/admin/users`
3. **Update user profiles** with actual names and email addresses
4. **Test organization-specific InfluxDB settings** if you plan to use multiple organizations

## What Changed

### Organizations Table
- Each organization can now have its own InfluxDB URL and token
- Supports multi-tenant deployments
- Your existing InfluxDB settings are preserved in the default organization

### Enhanced Users Table
- **Personal Data**: first_name, last_name, email, phone, job_title
- **Account Management**: status (active/inactive/suspended)
- **Audit Trail**: created_at, updated_at, last_login_at
- **Organization Link**: Each user belongs to an organization

### User Management Interface
- Shows all new fields in a comprehensive table
- Enhanced creation form with all personal data fields
- Organization selection dropdown
- Responsive design for mobile devices

## Troubleshooting

### "Cannot add a column with non-constant default" Error
This SQLite error occurs when trying to add timestamp columns with `CURRENT_TIMESTAMP` default. **This has been fixed in the updated migration script**. If you see this error:

1. Make sure you have the latest migration script (`node scripts/migrate.js`)
2. The script now adds timestamp columns without defaults and sets them via UPDATE

### "duplicate column name" Errors
This is normal - it means some columns already exist. The migration script handles this automatically.

### Migration Script Fails
1. Check that your `.env` file has the correct database path
2. Ensure the database file is writable
3. Verify you have the latest code with the migration script

### Database Locked
Make sure no other instance of the application is running before migration.

## Rollback (If Needed)

If you encounter issues, you can restore your backup:

```bash
# Stop the application first
# Then restore the backup
cp data.sqlite.backup.YYYYMMDD_HHMMSS data.sqlite
```

## Support

If you encounter any issues during migration, the automated script provides detailed logging to help identify and resolve problems.