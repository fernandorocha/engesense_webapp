# Engesense Webapp

Engesense Webapp is a Node.js/Express.js sensor data management web application that integrates with InfluxDB for time-series data visualization and SQLite for user management. The application provides secure authentication, real-time sensor data querying, and data export capabilities.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Setup
- Copy environment template: `cp .env.example .env`
- Edit `.env` with proper configuration (see Environment Variables section below)
- Install dependencies: `npm install` -- takes ~20-30 seconds, typically installs 200+ packages
- Initialize database: `node scripts/db.js` -- creates SQLite database with default admin user (admin/admin)

### Available Commands
- **Syntax validation**: `npm run check-syntax` -- validates all JavaScript files, runs in ~1 second
- **Linting**: `npm run lint` -- ESLint not fully configured but has fallback, runs in ~2 seconds
- **Development mode**: `npm run dev` -- starts server with debug logging on port 3100, starts in ~1 second
- **Production mode**: `npm start` -- starts server with info logging on port 3100, starts in ~1 second
- **Database initialization**: `node scripts/db.js` -- seeds admin user and creates tables, runs in ~1 second
- **Test command**: `npm test` -- returns "Error: no test specified" (no test suite configured)

### Environment Variables
Required variables that MUST be set in `.env`:
```bash
# Server Configuration
PORT=3100
NODE_ENV=development
LOG_LEVEL=info

# InfluxDB Configuration (CRITICAL: App requires InfluxDB server)
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your-influxdb-token-here

# Database Configuration
DB_FILE=./data.sqlite

# Session Security
SESSION_SECRET=your-very-secure-random-secret-key-change-this-in-production
```

### InfluxDB Dependency
**CRITICAL**: This application requires an external InfluxDB server for sensor data functionality:
- InfluxDB server must be running at the URL specified in `INFLUX_URL`
- Valid token with read permissions required in `INFLUX_TOKEN`
- Without InfluxDB, sensor API endpoints return "Could not fetch sensor data" errors
- The application will start and basic functionality (login, health check) works without InfluxDB
- **Workaround**: For development without InfluxDB, focus on authentication, user management, and UI components

## Validation and Testing

### Manual Validation Steps
Always execute these validation scenarios after making changes:

1. **Application Startup Validation**:
   - Run `npm run dev` and verify server starts on port 3100 without errors
   - Test health endpoint: `curl http://localhost:3100/health` should return JSON status
   
2. **Authentication Flow Validation**:
   - Visit `http://localhost:3100` (should redirect to `/login`)
   - Login with admin/admin credentials
   - Verify successful redirect to `/dashboard`
   - Access dashboard should show the energy monitoring interface
   
3. **API Endpoint Validation**:
   - Test health check: `curl http://localhost:3100/health` (should return JSON with status, timestamp, uptime)
   - Test login flow: `curl -d "username=admin&password=admin" -X POST http://localhost:3100/login` (should return redirect)
   - Test authenticated sensor endpoint (requires login session): `/api/sensors?range=-1h&buckets=test`
   - Expected without InfluxDB: Returns `{"error":"Could not fetch sensor data"}` with 500 status
   
4. **Complete End-to-End UI Validation**:
   - Navigate to `http://localhost:3100` (should redirect to login page)
   - Login page should display with username/password fields and blue styling
   - Login with admin/admin should redirect to dashboard
   - Dashboard should show "Welcome, admin (admin)" and sensor data interface
   - Expected errors: "Failed to load buckets" due to missing InfluxDB server (this is normal)

### Build and Development Workflow
- **No build step required** - this is a server-side Node.js application
- **No test suite configured** - `npm test` returns "Error: no test specified" and exits with code 1
- **Syntax checking**: Always run `npm run check-syntax` before committing changes (~1 second)
- **Development server**: Use `npm run dev` for debug logging and development (~1 second startup)
- **Production testing**: Use `npm start` to test production configuration (~1 second startup)
- **All commands complete quickly** - no long-running builds or tests, no special timeout requirements needed

## Common Tasks and Navigation

### Key Project Structure
```
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── middleware/
│   ├── auth.js           # Authentication middleware (ensureAuth, ensureAdmin)
│   └── validation.js     # Input validation middleware
├── routes/
│   ├── auth.js           # Login/logout endpoints
│   ├── admin.js          # User management endpoints
│   ├── sensors.js        # Sensor data API endpoints
│   └── export.js         # Data export functionality
├── scripts/
│   └── db.js             # Database initialization and seeding
├── utils/
│   ├── config.js         # Environment validation and configuration
│   ├── logger.js         # Structured logging utility
│   ├── db.js             # SQLite database connection
│   └── influx.js         # InfluxDB query utilities
└── views/
    ├── login.ejs         # Login page template
    ├── dashboard.ejs     # Main dashboard interface
    └── admin_users.ejs   # User management interface
```

### Important File Interactions
- **Configuration changes**: After modifying `utils/config.js`, restart the server to reload
- **Route changes**: Modifications to files in `routes/` require server restart
- **Database schema changes**: Run `node scripts/db.js` after modifying database structure
- **View changes**: EJS templates in `views/` are loaded dynamically, no restart needed
- **Static assets**: Files in `public/` are served statically

### Default User Accounts
- **Username**: admin
- **Password**: admin
- **Role**: admin
- **Organization**: engesense

**⚠️ SECURITY WARNING**: Always change default admin password in production environments!

## API Endpoints Reference

### Authentication
- `GET /login` - Login page
- `POST /login` - User authentication
- `POST /logout` - User logout

### Sensor Data (requires authentication)
- `GET /api/buckets` - List available InfluxDB buckets for user's organization
- `GET /api/measurements` - List available measurements from specified buckets
- `GET /api/sensors` - Query sensor readings with time range and filters

### Admin Functions (requires admin role)
- `GET /admin/users` - User management interface
- `POST /admin/users` - Create new user
- `DELETE /admin/users/:id` - Delete user

### Utility
- `GET /health` - Application health check (returns uptime and status)

## Common Troubleshooting

### Application Won't Start
- Verify all required environment variables are set in `.env`
- Check Node.js version (requires v14+)
- Run `npm install` if dependencies are missing
- Check port 3100 is not in use by another process

### Database Issues
- Run `node scripts/db.js` to reinitialize database
- Check `DB_FILE` path in `.env` is writable
- Default database location: `./data.sqlite`

### InfluxDB Connection Errors
- Verify InfluxDB server is running at `INFLUX_URL`
- Check `INFLUX_TOKEN` has correct permissions
- Test connection outside application if needed

### Session/Login Issues
- Verify `SESSION_SECRET` is set to a secure random string
- Clear browser cookies and try again
- Check user exists in database: database contains seeded admin user

## Development Best Practices

- Always run `npm run check-syntax` before committing code changes (~1 second)
- Use `npm run dev` for development to see debug logs (~1 second startup)
- Test authentication flows after making auth-related changes
- Verify health endpoint remains functional after infrastructure changes
- Test with and without InfluxDB server to ensure graceful degradation
- Use structured logging via the logger utility for debugging
- Follow existing validation patterns when adding new endpoints

### Testing UI Changes
When modifying views (.ejs files) or routes that affect the user interface:
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3100` in browser
3. Test complete login flow (admin/admin)
4. Verify dashboard loads and displays correctly
5. Check browser console for JavaScript errors (some InfluxDB-related errors are expected)
6. Test logout functionality
7. Verify responsive design and visual styling remain intact

## Quick Reference Commands

```bash
# Initial setup
cp .env.example .env
npm install
node scripts/db.js

# Development workflow
npm run check-syntax  # Validate syntax (~1s)
npm run dev           # Start development server (~1s)
curl http://localhost:3100/health  # Test health endpoint

# Login flow test
curl -d "username=admin&password=admin" -X POST http://localhost:3100/login

# Database reset
rm data.sqlite && node scripts/db.js
```