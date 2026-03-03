/**
 * Centralized logger configuration.
 * - LOG_LEVEL: log level (default: 'info' in prod, 'debug' in dev).
 * - NODE_ENV: development uses pretty-print; production uses JSON.
 */

export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent';

const VALID_LEVELS: LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

export const LoggerConfig = {
  isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  },

  getLogLevel(): LogLevel {
    const env = (process.env.LOG_LEVEL ?? '').toLowerCase();
    if (VALID_LEVELS.includes(env as LogLevel)) {
      return env as LogLevel;
    }
    return this.isDevelopment() ? 'debug' : 'info';
  },

  /** Options for nestjs-pino forRoot() — pinoHttp (level, transport, autoLogging, genReqId) */
  getPinoHttpOptions() {
    const level = this.getLogLevel();
    const transport = this.getPinoTransport();
    return {
      level,
      ...(transport && { transport }),
      autoLogging: false, // HTTP request logs are handled by LoggingInterceptor
      genReqId: (req: any) => {
        const id = req.headers?.['x-request-id'] ?? crypto.randomUUID();
        req.id = id;
        return id;
      },
    };
  },

  /** Transport for pretty-print in development only */
  getPinoTransport(): import('pino').TransportSingleOptions | undefined {
    if (!this.isDevelopment()) return undefined;
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  },
};
