type LogMethod = 'info' | 'warn' | 'error' | 'debug';

const isProd = import.meta.env.MODE === 'production';

const write = (method: LogMethod, message: string, context?: unknown): void => {
  if (isProd && method === 'debug') {
    return;
  }

  if (context !== undefined) {
    console[method](`[quiz-app] ${message}`, context);
    return;
  }

  console[method](`[quiz-app] ${message}`);
};

export const logger = {
  info: (message: string, context?: unknown): void =>
    write('info', message, context),
  warn: (message: string, context?: unknown): void =>
    write('warn', message, context),
  error: (message: string, context?: unknown): void =>
    write('error', message, context),
  debug: (message: string, context?: unknown): void =>
    write('debug', message, context),
};
