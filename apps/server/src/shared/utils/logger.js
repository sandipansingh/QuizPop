const shouldLogDebug = process.env.NODE_ENV !== 'production';

const formatLogEntry = (level, message, context = {}) => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  ...context,
});

const writeLog = (method, level, message, context) => {
  const entry = formatLogEntry(level, message, context);
  console[method](JSON.stringify(entry));
};

export const logger = {
  info: (message, context) => writeLog('info', 'info', message, context),
  warn: (message, context) => writeLog('warn', 'warn', message, context),
  error: (message, context) => writeLog('error', 'error', message, context),
  debug: (message, context) => {
    if (!shouldLogDebug) {
      return;
    }

    writeLog('debug', 'debug', message, context);
  },
};
