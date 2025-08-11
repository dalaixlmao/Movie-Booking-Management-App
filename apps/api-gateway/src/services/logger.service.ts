import winston from 'winston';

export class Logger {
  private logger: winston.Logger;
  
  constructor(private context: string) {
    const logLevel = process.env.LOG_LEVEL || 'info';
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
    
    this.logger = winston.createLogger({
      level: logLevel,
      format,
      defaultMeta: { context },
      transports: [
        // Write logs to console
        new winston.transports.Console(),
      ],
    });
  }
  
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }
  
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }
  
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
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
}

export default new Logger('Application');