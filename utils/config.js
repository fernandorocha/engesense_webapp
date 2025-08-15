// utils/config.js

/**
 * Environment configuration validation and management
 */
const logger = require('./logger');

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'INFLUX_URL',
  'INFLUX_TOKEN', 
  'SESSION_SECRET',
  'DB_FILE'
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  PORT: '3100',
  LOG_LEVEL: 'info',
  NODE_ENV: 'development'
};

/**
 * Validates that all required environment variables are present
 */
function validateEnvironment() {
  const missing = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Set defaults for optional variables
  for (const [envVar, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[envVar]) {
      process.env[envVar] = defaultValue;
      logger.info(`Set default for ${envVar}`, { value: defaultValue });
    }
  }
  
  logger.info('Environment validation successful');
}

/**
 * Gets configuration object with validated environment variables
 */
function getConfig() {
  return {
    port: parseInt(process.env.PORT, 10),
    logLevel: process.env.LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV,
    influx: {
      url: process.env.INFLUX_URL,
      token: process.env.INFLUX_TOKEN
    },
    session: {
      secret: process.env.SESSION_SECRET
    },
    database: {
      file: process.env.DB_FILE
    }
  };
}

module.exports = {
  validateEnvironment,
  getConfig
};