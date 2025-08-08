# Developer Onboarding Guide

Welcome to the Movie Booking App project! This guide will help you set up your development environment and start contributing to the project.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18 or higher
- **npm**: Version 9.2.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 14 or higher
- **Redis**: Version 6 or higher
- **Git**: For version control

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/movie-booking-app.git
cd movie-booking-app
```

### 2. Install Dependencies

The project uses npm workspaces to manage dependencies across the monorepo:

```bash
npm install
```

This will install dependencies for all packages and applications.

### 3. Database Configuration with Prisma

#### 3.1 Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/movie_booking_db"
EXPRESS_SERVER_URL="http://localhost:8080"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `username` and `password` with your PostgreSQL credentials.

#### 3.2 Create the Database

```bash
psql -U postgres
```

In the PostgreSQL prompt:

```sql
CREATE DATABASE movie_booking_db;
\q
```

#### 3.3 Run Prisma Migrations

Initialize the database schema:

```bash
npm run db:generate -w @repo/db
npx prisma migrate dev -w @repo/db
```

#### 3.4 Generate Prisma Client

```bash
npx prisma generate -w @repo/db
```

#### 3.5 Seed the Database (Optional)

To populate the database with sample data:

```bash
npx prisma db seed -w @repo/db
```

### 4. Redis Server Setup

#### 4.1 Install Redis (if not already installed)

**For Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install redis-server
```

**For macOS:**

```bash
brew install redis
```

**For Windows:**
Download and install Redis from [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)

#### 4.2 Start Redis Server

**For Ubuntu/Debian:**

```bash
sudo systemctl start redis-server
```

**For macOS:**

```bash
redis-server
```

**For Windows:**

```bash
redis-server.exe
```

#### 4.3 Using Docker (Alternative)

If you prefer using Docker for Redis:

```bash
docker run --name redis-server -p 6379:6379 -d redis
```

### 5. Running the Application with Turborepo

The project uses Turborepo to manage the monorepo and orchestrate running multiple services.

#### 5.1 Start All Services

```bash
npm run dev
```

This command will:
- Start the Next.js user-app on port 3000
- Start the Express server on port 8080
- Start the worker service that processes the queue
- Watch for file changes and rebuild as necessary

#### 5.2 Access the Application

- **User App**: [http://localhost:3000](http://localhost:3000)
- **Express Server API**: [http://localhost:8080](http://localhost:8080)

## Project Structure

The Movie Booking App is organized as a monorepo using Turborepo:

```
movie-booking-app/
├── apps/
│   ├── user-app/         # Next.js frontend
│   ├── express-server/   # Express.js API server
│   └── worker/           # Redis queue worker
├── packages/
│   ├── db/               # Prisma schema and database client
│   ├── store/            # Shared state management
│   ├── ui/               # Shared UI components
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── turbo.json            # Turborepo configuration
```

## Understanding the Application Architecture

For detailed information about the application architecture, refer to the [System Architecture Documentation](../architecture/system-overview.md).

## Working with the Database

### Prisma Schema

The database schema is defined in `/packages/db/prisma/schema.prisma`. Key models include:

- `User`: User information and authentication
- `Movie`: Movie details
- `Cinema`: Cinema venues
- `Audi`: Auditoriums within cinemas
- `Seat`: Individual seats in auditoriums
- `Booking`: Booking records
- `Slots`: Available screening slots

### Making Schema Changes

If you need to modify the database schema:

1. Edit `/packages/db/prisma/schema.prisma`
2. Create a new migration:

```bash
npx prisma migrate dev --name your_migration_name -w @repo/db
```

3. Apply the migration:

```bash
npx prisma migrate deploy -w @repo/db
```

4. Regenerate the Prisma client:

```bash
npx prisma generate -w @repo/db
```

## Troubleshooting

### PostgreSQL Connection Issues

#### Problem: Unable to connect to PostgreSQL

**Error:**
```
Error: P1001: Can't reach database server at `localhost`:`5432`
```

**Solutions:**

1. Check if PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

2. Verify connection settings in `.env`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/movie_booking_db"
```

3. Check PostgreSQL configuration in `pg_hba.conf` to allow local connections.

4. Ensure the database exists:

```bash
psql -U postgres -c '\l'
```

#### Problem: Authentication failed

**Error:**
```
Error: P1000: Authentication failed against database server at `localhost`
```

**Solution:**

1. Verify PostgreSQL credentials in your `.env` file
2. Try connecting manually to confirm credentials:

```bash
psql -U username -d movie_booking_db
```

### Redis Connection Issues

#### Problem: Redis connection refused

**Error:**
```
Redis client error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

1. Check if Redis server is running:

```bash
redis-cli ping
```

2. Start Redis if it's not running:

```bash
sudo systemctl start redis-server
```
or
```bash
redis-server
```

3. Check Redis port configuration:

```bash
redis-cli info | grep tcp_port
```

#### Problem: Redis authentication issues

**Error:**
```
Redis client error: ReplyError: NOAUTH Authentication required
```

**Solution:**

Update your Redis connection code to include authentication:

```typescript
const client = createClient({
  password: 'your-redis-password'
});
```

### Next.js Build Issues

#### Problem: TypeScript errors

**Solution:**

Check for type errors:

```bash
npm run lint
```

Fix type issues in the codebase or update TypeScript configuration in `tsconfig.json`.

#### Problem: Environment variables not working

**Solution:**

Make sure you have properly set up the `.env` file and that you're accessing environment variables correctly:

```typescript
// In Next.js
process.env.NEXT_PUBLIC_VARIABLE

// In Express
process.env.VARIABLE
```

### Worker Service Issues

#### Problem: Worker not processing queue items

**Solutions:**

1. Check if the worker is running:

```bash
ps aux | grep worker
```

2. Check Redis connection in the worker:

```typescript
client.on("error", (e) => {
  console.log("Worker error:", e);
});
```

3. Manually inspect the Redis queue:

```bash
redis-cli
LLEN bookedSeat
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check the project issues on GitHub
2. Reach out to the development team on Slack
3. Consult the detailed documentation in the `docs.codexhub.ai` directory