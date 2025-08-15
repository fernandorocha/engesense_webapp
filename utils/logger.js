// utils/logger.js

/**
 * Simple logging utility to replace console.log usage
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = process.env.LOG_LEVEL || 'info';
  }
  
  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.currentLevel];
  }
  
  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? 
      ` ${JSON.stringify(context)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${contextStr}`;
  }
  
  error(message, context = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, context));
    }
  }
  
  warn(message, context = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, context));
    }
  }
  
  info(message, context = {}) {
    if (this._shouldLog('info')) {
      console.log(this._formatMessage('info', message, context));
    }
  }
  
  debug(message, context = {}) {
    if (this._shouldLog('debug')) {
      console.log(this._formatMessage('debug', message, context));
    }
  }
}

module.exports = new Logger();