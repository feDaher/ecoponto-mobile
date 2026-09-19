import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

/**
 * Structured logger. In production, `debug`/`info` are discarded and
 * `warn`/`error` are the plug-in point for a collector (Sentry, etc.).
 *
 * LGPD: never log the user's e-mail, phone or exact coordinates.
 * Use opaque identifiers (`userId`) and round geolocation.
 */
function emit(level: LogLevel, message: string, context?: LogContext) {
  if (!env.isDev && (level === 'debug' || level === 'info')) return;

  const payload = context ? { message, ...context } : { message };

  if (level === 'error') console.error('[ecoponto]', payload);
  else if (level === 'warn') console.warn('[ecoponto]', payload);
  else console.log(`[ecoponto:${level}]`, payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};
