import log from 'loglevel';

// Configure log level based on environment
const logLevel = process.env.DEBUG ? 'debug' : (process.env.NODE_ENV ===
  'production' ? 'warn' : 'info');
log.setLevel(logLevel);

// Custom logger with prefix support
const logger = {
  trace: (message, prefix) => log.trace(prefix ? `[${prefix}] ${message}` :
    message),
  debug: (message, prefix) => log.debug(prefix ? `[${prefix}] ${message}` :
    message),
  info: (message, prefix) => log.info(prefix ? `[${prefix}] ${message}` :
    message),
  warn: (message, prefix) => log.warn(prefix ? `[${prefix}] ${message}` :
    message),
  error: (message, prefix) => log.error(prefix ? `[${prefix}] ${message}` :
    message),
  setLevel: (level) => log.setLevel(level)
};

export default logger;
