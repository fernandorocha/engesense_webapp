# Engesense Webapp

A sensor data management web application built with Node.js, Express.js, and InfluxDB for monitoring and visualizing sensor readings.

## Features

- 🔐 **Secure Authentication** - Session-based auth with role management (admin/client)
- 📊 **Sensor Data Visualization** - Query and display time-series sensor data from InfluxDB
- 📤 **Data Export** - Export sensor readings to CSV format
- 🛡️ **Input Validation** - Comprehensive validation for all API endpoints
- 📝 **Structured Logging** - Configurable logging with multiple levels
- 🏥 **Health Monitoring** - Built-in health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- InfluxDB instance
- SQLite3

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Server Configuration
PORT=3100
NODE_ENV=development
LOG_LEVEL=info

# InfluxDB Configuration
INFLUX_URL=http://your-influx-server:8086
INFLUX_TOKEN=your-influx-token
INFLUX_ORG=your-organization
INFLUX_BUCKET=your-bucket

# Database Configuration
DB_FILE=./data.sqlite

# Session Security
SESSION_SECRET=your-very-secure-random-secret-key
```

### 2. Installation

```bash
npm install
```

### 3. Start the Application

```bash
# Production mode
npm start

# Development mode (with debug logging)
npm run dev
```

### 4. Access the Application

Visit `http://localhost:3100` and log in with:
- **Username**: admin
- **Password**: admin

**⚠️ Important**: Change the default admin password immediately in production!

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `POST /logout` - Logout user

### Sensor Data
- `GET /api/sensors` - Query sensor readings
  - Query params: `range`, `start`, `stop`, `limit`
  - Example: `/api/sensors?range=-1h&limit=1000`

### Data Export
- `GET /export` - Export sensor data as CSV
  - Same query params as sensor API

### Administration
- `GET /admin/users` - Manage users (admin only)
- `POST /admin/users` - Create new user (admin only)

### Health Check
- `GET /health` - Application health status

## Query Parameters

### Time Range Options

**Relative Range:**
```
?range=-1h    # Last hour
?range=-30m   # Last 30 minutes
?range=-7d    # Last 7 days
```

**Absolute Range:**
```
?start=2024-01-01T00:00:00Z&stop=2024-01-02T00:00:00Z
```

### Pagination
```
?limit=1000   # Maximum 10,000 records
```

## Project Structure

```
├── app.js                 # Main application entry point
├── db.js                  # SQLite database setup
├── package.json
├── .env.example          # Environment template
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── validation.js     # Input validation middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── admin.js          # Admin user management
│   ├── sensors.js        # Sensor data API
│   └── export.js         # Data export functionality
├── utils/
│   ├── config.js         # Configuration management
│   ├── logger.js         # Logging utility
│   └── influx.js         # InfluxDB query utilities
└── views/
    ├── login.ejs         # Login page template
    ├── dashboard.ejs     # Main dashboard
    └── admin_users.ejs   # User management interface
```

## Security Features

- ✅ Input validation on all endpoints
- ✅ Secure session configuration
- ✅ SQL injection prevention
- ✅ XSS protection via httpOnly cookies
- ✅ Error message sanitization
- ✅ Environment variable validation
- ✅ Structured audit logging

## Development

### Available Scripts

```bash
npm run dev          # Start with development logging
npm run check-syntax # Validate JavaScript syntax
npm run lint         # Run ESLint (if configured)
```

### Logging Levels

Set `LOG_LEVEL` environment variable:
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging information

### Database Schema

The SQLite database contains a `users` table:

```sql
CREATE TABLE users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role     TEXT CHECK(role IN ('admin','client')) NOT NULL
);
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `SESSION_SECRET`
3. Change default admin password
4. Configure proper SSL termination
5. Set up log rotation
6. Monitor the `/health` endpoint

## Troubleshooting

### Common Issues

**"INFLUX_BUCKET not defined"**
- Ensure all required environment variables are set in `.env`

**"Failed to query sensor data"**
- Verify InfluxDB connection settings
- Check InfluxDB token permissions
- Ensure bucket and measurement names are correct

**Session issues**
- Clear browser cookies
- Verify `SESSION_SECRET` is set

## Contributing

1. Check syntax: `npm run check-syntax`
2. Test your changes
3. Follow existing code style
4. Update documentation as needed

## License

ISC
