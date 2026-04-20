const isProd = import.meta.env.MODE === 'production';

const write = (method, message, context = null) => {
  if (isProd && method === 'debug') {
    return;
  }

  if (context) {
    console[method](`[quiz-app] ${message}`, context);
    return;
  }

  console[method](`[quiz-app] ${message}`);
};

export const logger = {
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
  debug: (message, context) => write('debug', message, context),
};
