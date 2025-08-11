import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import RouterService from './services/router.service';
import MonitoringService from './services/monitoring.service';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { validateContentType } from './middleware/validation.middleware';
import logger from './services/logger.service';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Core middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Validate content type
  app.use(validateContentType(['application/json']));
  
  // Monitoring and logging
  app.use(MonitoringService.requestLogger());
  app.get('/metrics', MonitoringService.metricsEndpoint());
  
  // API routes
  app.use(RouterService.getRouter());
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  // Start server
  app.listen(port, () => {
    logger.info(`API Gateway running on port ${port}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    process.exit(1);
  });
}

bootstrap().catch(error => {
  console.error('Failed to start API Gateway', error);
  process.exit(1);
});