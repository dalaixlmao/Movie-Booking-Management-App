import winston from 'winston';

export interface LoggerOptions {
  level?: string;
  context?: string;
  meta?: Record<string, any>;
}

export class Logger {
  private logger: winston.Logger;
  private context: string;
  private defaultMeta: Record<string, any>;
  
  constructor(options: LoggerOptions = {}) {
    const { level = 'info', context = 'Application', meta = {} } = options;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Define the format for logs
    const format = isDevelopment
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
            return `${timestamp} [${context}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        )
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        );
    
    this.context = context;
    this.defaultMeta = meta;
    
    this.logger = winston.createLogger({
      level,
      format,
      defaultMeta: { context, ...meta },
      transports: [
        // Write logs to console
        new winston.transports.Console(),
      ],
    });
  }
  
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { ...meta });
  }
  
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { ...meta });
  }
  
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { ...meta });
  }
  
  error(message: string, error?: any): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          ...error,
        },
      });
    } else {
      this.logger.error(message, { error });
    }
  }
  
  // Create a child logger with additional context
  child(options: LoggerOptions): Logger {
    return new Logger({
      level: options.level || this.logger.level,
      context: options.context || this.context,
      meta: { ...this.defaultMeta, ...options.meta },
    });
  }
}

// Create default logger
export const logger = new Logger();

export default logger;