# Database Best Practices Guide

## Introduction

This guide outlines the best practices for working with the Movie Booking App database. Following these guidelines ensures optimal performance, security, and maintainability of the database.

## Schema Design

### 1. Use Appropriate Data Types

Choose the most appropriate data type for each column:

- Use `INTEGER` for numeric IDs
- Use `TIMESTAMP` for date and time values
- Use `TEXT` for variable-length strings
- Use `BOOLEAN` for true/false values
- Use `ARRAY` for arrays of values (PostgreSQL specific)

### 2. Normalize But Don't Over-Normalize

- Follow normalization principles to reduce data redundancy
- Avoid over-normalization that leads to excessive joins
- Consider selective denormalization for performance where appropriate

### 3. Use Constraints for Data Integrity

Always define appropriate constraints:

```prisma
model Seat {
  // ...
  @@unique([row, col, audiId])
}

// In SQL migration
ALTER TABLE "User" ADD CONSTRAINT "balance_check" CHECK ("balance" >= 0);
```

### 4. Design for the Future

- Include status fields for record lifecycles (e.g., `isActive`)
- Add timestamps for auditing (`createdAt`, `updatedAt`)
- Use soft deletes instead of hard deletes where appropriate
- Design schema to accommodate future requirements

## Indexing Strategy

### 1. Index All Foreign Keys

```prisma
model Booking {
  // ...
  userId Int
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

### 2. Create Composite Indexes for Common Query Patterns

```prisma
model Booking {
  // ...
  @@index([userId, startTime])
  @@index([cinemaId, startTime])
}
```

### 3. Consider Covering Indexes

When specific columns are frequently queried together, create covering indexes:

```sql
CREATE INDEX "movie_details_idx" ON "Movie"("id", "name", "rating", "certificate")
WHERE "isActive" = true;
```

### 4. Index Carefully

- Don't over-index (indexes consume space and slow down writes)
- Monitor index usage and remove unused indexes
- Consider partial indexes for filtered queries
- Use appropriate index types (B-tree, GIN, etc.) based on query patterns

## Query Optimization

### 1. Use Parameterized Queries

Avoid string concatenation for building queries:

```typescript
// Bad
const query = `SELECT * FROM "User" WHERE "email" = '${email}'`;

// Good
await prisma.user.findUnique({ where: { email } });
```

### 2. Select Only Required Columns

```typescript
// Bad - fetches all columns
const user = await prisma.user.findUnique({ where: { id } });

// Good - fetches only needed columns
const user = await prisma.user.findUnique({
  where: { id },
  select: { name: true, email: true, city: true }
});
```

### 3. Avoid N+1 Query Problems

```typescript
// Bad - causes N+1 problem
const cinemas = await prisma.cinema.findMany();
for (const cinema of cinemas) {
  const auditoriums = await prisma.audi.findMany({ 
    where: { cinemaId: cinema.id } 
  });
}

// Good - single query with relation loading
const cinemas = await prisma.cinema.findMany({
  include: { auditoriums: true }
});
```

### 4. Use JOINs Wisely

- Don't include unnecessary tables in JOINs
- Use appropriate JOIN types (INNER, LEFT, etc.)
- Ensure joined columns are properly indexed

### 5. Batch Operations

```typescript
// Bad - multiple individual updates
for (const id of seatIds) {
  await prisma.seat.update({
    where: { id },
    data: { booked: true }
  });
}

// Good - batch update
await prisma.seat.updateMany({
  where: { id: { in: seatIds } },
  data: { booked: true }
});
```

## Transaction Management

### 1. Use Transactions for Related Operations

```typescript
await prisma.$transaction(async (tx) => {
  // Create booking
  const booking = await tx.booking.create({ ... });
  
  // Update seats
  await tx.seat.updateMany({ ... });
  
  // Update user balance
  await tx.user.update({ ... });
});
```

### 2. Set Appropriate Isolation Levels

```typescript
await prisma.$transaction(
  async (tx) => { ... },
  { isolationLevel: "Serializable" }
);
```

### 3. Keep Transactions Short

- Minimize the work done within transactions
- Avoid external API calls or long computations inside transactions
- Prepare data outside the transaction when possible

### 4. Handle Transaction Failures

```typescript
try {
  await prisma.$transaction(async (tx) => { ... });
} catch (error) {
  if (isRetryableError(error)) {
    // Retry logic
  } else {
    // Handle non-retryable error
  }
}
```

## Performance Considerations

### 1. Use Connection Pooling

Configure connection pooling in your database client:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  connectionLimit: {
    min: 5,
    max: 10,
  },
});
```

### 2. Implement Caching

Use Redis or a similar caching system for frequently accessed, rarely changing data:

```typescript
async function getActiveMovies() {
  // Check cache first
  const cachedMovies = await redis.get('active_movies');
  if (cachedMovies) {
    return JSON.parse(cachedMovies);
  }
  
  // If not in cache, fetch from database
  const movies = await prisma.movie.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
  
  // Store in cache with expiration
  await redis.set('active_movies', JSON.stringify(movies), 'EX', 300); // 5 minutes
  
  return movies;
}
```

### 3. Use Pagination

Always implement pagination for potentially large result sets:

```typescript
async function getMovies(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  
  const [movies, total] = await prisma.$transaction([
    prisma.movie.findMany({
      skip,
      take: pageSize,
      where: { isActive: true },
      orderBy: { name: 'asc' }
    }),
    prisma.movie.count({ where: { isActive: true } })
  ]);
  
  return {
    data: movies,
    meta: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize)
    }
  };
}
```

### 4. Monitor Query Performance

- Use `EXPLAIN ANALYZE` to understand query execution plans
- Set up slow query logging
- Monitor database performance metrics

## Security Best Practices

### 1. Use Secure Connection Strings

Always use SSL connections to the database:

```
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### 2. Implement Proper Access Control

- Use separate database users with appropriate permissions
- Never use the superuser account in application code
- Grant only the permissions needed for each role

### 3. Sanitize and Validate User Input

Always validate and sanitize user input before using it in queries:

```typescript
// Use zod or similar for validation
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
});

const result = schema.safeParse(req.body);
if (!result.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}

// Now use the validated data
const { email, name } = result.data;
```

### 4. Protect Sensitive Data

- Hash passwords before storing
- Encrypt sensitive data
- Implement proper data retention policies

```typescript
import { hash } from "bcrypt";

// Hash passwords before storing
const hashedPassword = await hash(password, 10);
await prisma.user.create({
  data: {
    email,
    name,
    password: hashedPassword
  }
});
```

## Backup and Recovery

### 1. Regular Backups

Implement automated backup procedures:

```bash
# Example PostgreSQL backup script
pg_dump -U username -d database -F c -b -v -f "/path/to/backup/database-$(date +%Y%m%d%H%M%S).bak"
```

### 2. Verify Backups

Regularly verify that backups can be restored:

```bash
# Test restore in staging environment
pg_restore -U username -d test_database -v "/path/to/backup/database.bak"
```

### 3. Define Recovery Point Objective (RPO)

Document your RPO requirements and ensure your backup strategy meets them.

## Migration Practices

### 1. Test Migrations

Always test migrations in development and staging environments first.

### 2. Make Migrations Reversible

Where possible, provide a way to roll back migrations:

```sql
-- Migration
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Rollback
ALTER TABLE "User" DROP COLUMN "role";
```

### 3. Apply Migrations with Zero Downtime

Design migrations to work without locking tables for extended periods.

## Advanced PostgreSQL Features

### 1. Full Text Search

```typescript
// Using Prisma's raw query capabilities for full text search
const movies = await prisma.$queryRaw`
  SELECT id, name, rating 
  FROM "Movie" 
  WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
    @@ plainto_tsquery('english', ${searchTerm})
  ORDER BY ts_rank(to_tsvector('english', name), plainto_tsquery('english', ${searchTerm})) DESC
`;
```

### 2. JSON/JSONB Capabilities

```typescript
// Store complex data in JSONB fields
await prisma.$executeRaw`
  UPDATE "Movie" 
  SET "metadata" = jsonb_set(
    COALESCE("metadata", '{}'::jsonb),
    '{awards}',
    $1::jsonb
  )
  WHERE id = $2
`([JSON.stringify(awards)], movieId);
```

### 3. Window Functions for Analytics

```typescript
// Get movies with their rank by rating
const rankedMovies = await prisma.$queryRaw`
  SELECT id, name, rating,
    RANK() OVER (ORDER BY CAST(rating AS DECIMAL) DESC) as rank
  FROM "Movie"
  WHERE "isActive" = true
`;
```

## Conclusion

Following these database best practices will ensure that the Movie Booking App database remains performant, secure, and maintainable as the application grows. Regular reviews and updates to these practices are recommended as the application evolves.