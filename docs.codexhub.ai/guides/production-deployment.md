# Production Deployment Guide

This guide provides detailed instructions for deploying the Movie Booking App to a production environment, including configuration, best practices, and monitoring strategies.

## Architecture Overview

Before diving into deployment, let's review the architecture:

1. **User-App (Next.js)**: Frontend application for users to browse movies and book tickets
2. **Express Server**: API server that handles booking requests and adds them to Redis queue
3. **Worker Service**: Processes bookings from Redis queue and updates the database
4. **PostgreSQL Database**: Stores all application data
5. **Redis**: Used as a message queue for booking transactions

## Deployment Options

### Option 1: Containerized Deployment (Recommended)

The repository includes Docker configurations for containerized deployment, which is the recommended approach.

#### Prerequisites

- Docker and Docker Compose
- A domain name with DNS configured
- SSL certificates for secure communication

#### Docker Compose Setup

Create a `docker-compose.production.yml` file:

```yaml
version: '3'

services:
  user-app:
    build:
      context: .
      dockerfile: Dockerfile.user-app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - EXPRESS_SERVER_URL=http://express-server:8080
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: always

  express-server:
    build:
      context: .
      dockerfile: Dockerfile.express-server
    environment:
      - REDIS_URL=redis://redis:6379
    ports:
      - "8080:8080"
    depends_on:
      - redis
    restart: always

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:6
    volumes:
      - redis-data:/data
    restart: always

volumes:
  postgres-data:
  redis-data:
```

#### Building and Deploying with Docker

1. Create the necessary Dockerfiles:

**Dockerfile.user-app**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build -w=@repo/db
RUN npm run build -w=apps/user-app

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/user-app/.next /app/.next
COPY --from=builder /app/apps/user-app/public /app/public
COPY --from=builder /app/apps/user-app/package.json /app/package.json
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "node_modules/.bin/next", "start"]
```

2. Set up environment variables in a `.env` file:

```
# Database
DATABASE_URL=postgresql://username:password@postgres:5432/movie_booking_db
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_DB=movie_booking_db

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Redis
REDIS_URL=redis://redis:6379
```

3. Deploy with Docker Compose:

```bash
docker-compose -f docker-compose.production.yml up -d
```

4. Run database migrations:

```bash
docker-compose -f docker-compose.production.yml exec worker npx prisma migrate deploy
```

### Option 2: Cloud Platform Deployment

Alternatively, you can deploy the components separately on cloud platforms:

- **User-App**: Deploy on Vercel or Netlify
- **Express Server & Worker**: Deploy on a cloud service like Heroku, AWS ECS, or Google Cloud Run
- **PostgreSQL**: Use managed service like AWS RDS, Google Cloud SQL, or DigitalOcean Managed Databases
- **Redis**: Use managed service like AWS ElastiCache, Google Cloud Memorystore, or Upstash

## Environment Variables Configuration

Proper environment variable configuration is crucial for a secure production deployment:

### Required Environment Variables

#### User-App (Next.js)

```
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-secure-random-string
NEXTAUTH_URL=https://your-domain.com

# API Connections
EXPRESS_SERVER_URL=https://api.your-domain.com
```

#### Express Server

```
# Redis
REDIS_URL=redis://username:password@host:port
```

#### Worker Service

```
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://username:password@host:port
```

### Generating Secure Values

For `NEXTAUTH_SECRET`, generate a secure random string:

```bash
openssl rand -base64 32
```

## Scaling Considerations

### 1. Redis Queue Scaling

The Redis queue system is designed to process booking requests sequentially, which is important for preventing double bookings. However, this can become a bottleneck as your application scales.

**Considerations:**

- **Multiple Workers**: You can run multiple worker instances to handle different queues for different theaters or regions, but each queue should still be processed sequentially.
- **Redis Cluster**: For high availability and better performance, consider using a Redis cluster.
- **Monitoring**: Set up monitoring to track queue length and processing time.

### 2. Database Scaling

As your application grows, you'll need to scale your database:

- **Read Replicas**: Add read replicas to handle read-heavy operations.
- **Connection Pooling**: Implement connection pooling to manage database connections efficiently.
- **Database Sharding**: For very large deployments, consider sharding the database by region or theater.

### 3. Frontend Scaling

The Next.js user-app can be scaled horizontally:

- **Static Generation**: Use Next.js static generation for pages that don't require dynamic content.
- **CDN**: Deploy static assets to a CDN for faster delivery.
- **Edge Functions**: Use edge functions for location-based content delivery.

## Monitoring and Performance

### 1. Monitoring the Queue Worker

Monitoring the worker service is crucial to ensure booking requests are being processed correctly:

```typescript
// Add to worker service
import { createClient } from "redis";
import { PrismaClient } from "@repo/db/client";
import { metrics } from './metrics'; // Example metrics library

const prisma = new PrismaClient();
const client = createClient();

// Add metrics
let queueLength = 0;
let processedCount = 0;
let errorCount = 0;
let avgProcessingTime = 0;

async function startWorker() {
  try {
    await client.connect();
    console.log("Redis worker Client connected");
    
    // Report metrics at regular intervals
    setInterval(async () => {
      const currentQueueLength = await client.lLen("bookedSeat");
      metrics.gauge('booking_queue.length', currentQueueLength);
      metrics.gauge('booking_queue.processed_count', processedCount);
      metrics.gauge('booking_queue.error_count', errorCount);
      metrics.gauge('booking_queue.avg_processing_time', avgProcessingTime);
    }, 5000);

    while (true) {
      try {
        const startTime = Date.now();
        const elem = await client.brPop("bookedSeat", 0);
        
        if (elem?.element) {
          await applyBooking(elem.element);
          
          // Update metrics
          processedCount++;
          const processingTime = Date.now() - startTime;
          avgProcessingTime = (avgProcessingTime * (processedCount - 1) + processingTime) / processedCount;
          
          console.log(`Booking processed in ${processingTime}ms:`, elem);
        }
      } catch (e) {
        errorCount++;
        console.log("Error in processing booking:", e);
      }
    }
  } catch (e) {
    console.log("Error in connecting worker:", e);
  }
}
```

### 2. Performance Monitoring Tools

Consider implementing the following tools:

- **Application Monitoring**: New Relic, Datadog, or Prometheus with Grafana
- **Log Management**: ELK Stack (Elasticsearch, Logstash, Kibana) or Loki with Grafana
- **Error Tracking**: Sentry
- **Real User Monitoring**: Google Analytics or Mixpanel

### 3. Key Metrics to Track

- **Queue Metrics**:
  - Queue length
  - Processing time
  - Error rate
  - Throughput

- **Database Metrics**:
  - Query performance
  - Connection pool utilization
  - Lock contention (especially for seat booking)
  - Transaction rate

- **Frontend Metrics**:
  - Page load time
  - Time to interactive
  - Core Web Vitals

## Security Considerations

### 1. API Security

- **Rate Limiting**: Implement rate limiting to prevent abuse:

```typescript
// Express server
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

- **Input Validation**: Always validate input data using a schema validation library like Zod.

### 2. Database Security

- **Connection Security**: Use SSL for database connections.
- **Least Privilege**: Create database users with minimal required permissions.
- **Sensitive Data**: Never store sensitive data like payment information directly; use tokenization services.

### 3. Authentication Security

- **HTTPS**: Always use HTTPS in production.
- **Session Management**: Set appropriate session timeouts.
- **Password Policy**: Enforce strong password requirements.

## Backup Strategy

Implement a comprehensive backup strategy:

1. **Database Backups**:
   - Daily full backups
   - Continuous WAL (Write-Ahead Log) archiving for point-in-time recovery
   - Test recovery procedures regularly

2. **Configuration Backups**:
   - Environment variables
   - Docker configuration files
   - Infrastructure as Code (IaC) templates

## Disaster Recovery

Create a disaster recovery plan that includes:

1. **Recovery Time Objective (RTO)**: Maximum acceptable downtime
2. **Recovery Point Objective (RPO)**: Maximum acceptable data loss
3. **Failover Procedures**: Steps to activate standby systems
4. **Communication Plan**: How to notify stakeholders during outages

## Continuous Integration/Continuous Deployment (CI/CD)

Set up a CI/CD pipeline for automated testing and deployment:

1. **Testing**: Run unit, integration, and end-to-end tests
2. **Build**: Build Docker images
3. **Deploy**: Deploy to staging and production environments
4. **Monitor**: Monitor deployment for issues

Example GitHub Actions workflow:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push user-app
        uses: docker/build-push-action@v2
        with:
          context: .
          file: ./Dockerfile.user-app
          push: true
          tags: yourusername/movie-booking-user-app:latest
      
      # Add similar steps for express-server and worker
      
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/deployment
            docker-compose -f docker-compose.production.yml pull
            docker-compose -f docker-compose.production.yml up -d
```

## Conclusion

Deploying the Movie Booking App to production requires careful planning and configuration. By following this guide, you can ensure a secure, scalable, and maintainable deployment that provides a reliable service to your users.

Remember that production deployment is an ongoing process, not a one-time task. Regularly review and update your deployment strategy as your application evolves and grows.