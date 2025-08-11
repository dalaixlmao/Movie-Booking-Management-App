# Optimized Database Schema Documentation

This document provides a comprehensive overview of the optimized database schema for the Movie Booking App. The application uses PostgreSQL as the database and Prisma as the ORM (Object-Relational Mapping) tool.

## Schema Overview

The optimized database schema builds on the existing structure while adding performance improvements, enhanced data integrity, and improved data modeling. Key improvements include:

1. Comprehensive indexing strategy
2. Added timestamps and auditing capabilities
3. Enhanced referential integrity with proper cascade rules
4. New transaction tracking model
5. Optimized database constraints

## Core Models

### User

```prisma
model User {
  id Int @id @default(autoincrement())
  name String
  phone String
  email String @unique
  password String
  city String?
  state String?
  zip String?
  bookings Booking[]
  balance Int @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  transactions Transaction[]
  role String @default("user")

  @@index([email])
}
```

**Enhancements:**
- Added `createdAt` and `updatedAt` timestamps for auditing
- Added default value of 0 for balance
- Added user role for access control
- Added index on email field for faster lookups
- Added relationship to new Transaction model

### Bank

```prisma
model Bank {
  id Int @id @default(autoincrement())
  balance Int @default(10000000)
  updatedAt DateTime @updatedAt
}
```

**Enhancements:**
- Added `updatedAt` timestamp for tracking balance changes
- Added database constraint to prevent negative balances

### Movie

```prisma
model Movie {
  id Int @id @default(autoincrement())
  name String
  languages String[]
  certificate String
  rating String
  dates DateTime[]
  cinemas Cinema[]
  poster String?
  slots Slots[]
  description String? @db.Text
  duration Int? // duration in minutes
  genre String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isActive Boolean @default(true)

  @@index([name])
  @@index([isActive])
}
```

**Enhancements:**
- Added `description` field for movie details
- Added `duration` in minutes
- Added `genre` array for categorization
- Added `isActive` flag to soft-delete/deactivate movies
- Added timestamps for auditing
- Added indexes on name and isActive for common queries

### Cinema

```prisma
model Cinema {
  id Int @id @default(autoincrement())
  name String
  auditoriums Audi[]
  movies Movie[]
  city String
  state String
  zip String
  bookings Booking[]
  address String?
  phoneNumber String?
  email String?
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([city])
  @@index([isActive])
}
```

**Enhancements:**
- Added `address`, `phoneNumber`, and `email` fields
- Added `isActive` flag to soft-delete/deactivate cinemas
- Added timestamps for auditing
- Added indexes on city and isActive for common queries

### Audi (Auditorium)

```prisma
model Audi {
  id Int @id @default(autoincrement())
  rows Int @default(1)
  cols Int @default(1)
  name String
  seats Seat[]
  cinemaId Int
  cinema Cinema @relation(fields: [cinemaId], references: [id], onDelete: Cascade)
  slots Slots[]
  capacity Int @default(0)
  audiType String @default("standard") // standard, imax, 3d, etc.
  isActive Boolean @default(true)

  @@index([cinemaId])
  @@index([isActive])
}
```

**Enhancements:**
- Added `capacity` field for total seat count
- Added `audiType` for categorization (standard, IMAX, 3D, etc.)
- Added `isActive` flag for disabling auditoriums temporarily
- Added cascade delete from Cinema
- Added indexes on cinemaId and isActive for common queries

### Seat

```prisma
model Seat {
  id Int @id @default(autoincrement())
  row Int
  col Int
  audiId Int
  audi Audi @relation(fields: [audiId], references: [id], onDelete: Cascade)
  booked Boolean @default(false)
  bookingId Int?
  booking Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  price Int @default(0)
  seatType String @default("standard") // standard, premium, vip, etc.

  @@unique([row, col, audiId])
  @@index([audiId, booked])
  @@index([bookingId])
}
```

**Enhancements:**
- Added `seatType` for categorization (standard, premium, VIP)
- Added unique constraint on row, column, and audiId combination
- Added cascade delete from Audi
- Added SetNull for booking relationship to maintain history
- Added composite index on audiId and booked status for fast seat availability checks

### Slots

```prisma
model Slots {
  id Int @id @default(autoincrement())
  movieId Int
  slots DateTime[]
  audiId Int
  movie Movie @relation(fields: [movieId], references: [id], onDelete: Cascade)
  audi Audi @relation(fields: [audiId], references: [id], onDelete: Cascade)
  available Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([movieId])
  @@index([audiId])
  @@index([movieId, audiId])
}
```

**Enhancements:**
- Added `available` flag to disable specific slots
- Added timestamps for auditing
- Added cascade delete from both Movie and Audi
- Added indexes on movieId and audiId for faster lookups
- Added composite index for common join queries

### Booking

```prisma
model Booking {
  id Int @id @default(autoincrement())
  cinemaId Int
  cinema Cinema @relation(fields: [cinemaId], references: [id])
  seats Seat[]
  startTime DateTime
  userId Int
  user User @relation(fields: [userId], references: [id])
  status String @default("confirmed") // confirmed, cancelled, refunded
  totalAmount Int @default(0)
  transactionId String?
  transactions Transaction[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, startTime])
  @@index([cinemaId, startTime])
  @@index([status])
}
```

**Enhancements:**
- Added `status` field for booking lifecycle (confirmed, cancelled, refunded)
- Added `totalAmount` for tracking booking value
- Added `transactionId` for payment reference
- Added timestamps for auditing
- Added relationship to new Transaction model
- Added composite indexes for common queries

### Transaction (New Model)

```prisma
model Transaction {
  id Int @id @default(autoincrement())
  userId Int
  user User @relation(fields: [userId], references: [id])
  amount Int
  type String // payment, refund
  status String // success, failed, pending
  bookingId Int?
  booking Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  paymentMethod String?
  paymentReference String?

  @@index([userId])
  @@index([bookingId])
  @@index([status])
  @@index([createdAt])
}
```

**Key Features:**
- Tracks all financial transactions in the system
- Records payment methods and external references
- Links to both users and bookings
- Includes transaction type (payment, refund)
- Includes status tracking (success, failed, pending)
- Comprehensive indexing for reporting and lookups

## Database Migrations

A new migration has been created to implement these schema changes:

```sql
-- Add indexes to improve query performance
CREATE INDEX "Seat_audiId_booked_idx" ON "Seat"("audiId", "booked");
CREATE INDEX "Booking_userId_startTime_idx" ON "Booking"("userId", "startTime");
CREATE INDEX "Slots_movieId_idx" ON "Slots"("movieId");
CREATE INDEX "Slots_audiId_idx" ON "Slots"("audiId");

-- Add transaction history table
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Add refund status to booking
ALTER TABLE "Booking" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE "Booking" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add constraints
ALTER TABLE "Seat" ADD CONSTRAINT "seat_row_col_audi_unique" UNIQUE ("row", "col", "audiId");
ALTER TABLE "User" ADD CONSTRAINT "balance_check" CHECK ("balance" >= 0);
ALTER TABLE "Bank" ADD CONSTRAINT "balance_check" CHECK ("balance" >= 0);

-- Add necessary foreign keys
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create trigger to update timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_updated_at BEFORE UPDATE
ON "Booking" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE
ON "Transaction" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## Entity Relationships

Here's a visual representation of the relationships between entities:

```
┌───────┐       ┌────────────┐       ┌─────────┐       ┌───────┐
│ User  │───┬───│Transaction │   ┌───│ Booking │───┐───│ Cinema│
└───────┘   │   └────────────┘   │   └─────────┘   │   └───────┘
    │       │          │         │        │        │       │
    │       └──────────┘         │        │        │       │
    └───────────────────────────┘        │        │       │
                                         │        │       │
                                    ┌────┴────┐   │   ┌───┴───┐
                                    │  Seat   │◄──┘   │ Audi  │
                                    └─────────┘       └───────┘
                                         ▲                │
                                         │                │
                                         │    ┌───────┐   │
                                         └────│ Slots │◄──┘
                                              └───────┘
                                                  │
                                                  │
                                              ┌───┴───┐
                                              │ Movie │
                                              └───────┘
```

## Best Practices for Database Operations

### Using Transactions for Seat Booking

When booking seats, use transactions to ensure atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  // Lock the seats to prevent double booking
  const seatsToBook = await tx.seat.findMany({
    where: {
      id: { in: seatIds },
      booked: false,
    },
  });
  
  if (seatsToBook.length !== seatIds.length) {
    throw new Error('One or more seats are already booked');
  }
  
  // Create booking
  const booking = await tx.booking.create({
    data: {
      cinemaId,
      userId,
      startTime,
      totalAmount: totalPrice,
      status: 'confirmed',
    },
  });
  
  // Update seat status
  await tx.seat.updateMany({
    where: { id: { in: seatIds } },
    data: { 
      booked: true, 
      bookingId: booking.id 
    },
  });
  
  // Record transaction
  await tx.transaction.create({
    data: {
      userId,
      amount: totalPrice,
      type: 'payment',
      status: 'success',
      bookingId: booking.id,
    },
  });
  
  // Update user balance
  await tx.user.update({
    where: { id: userId },
    data: { 
      balance: { decrement: totalPrice } 
    },
  });
  
  return booking;
}, {
  isolation: 'serializable', // Highest isolation level
});
```

### Efficient Cinema and Movie Queries

For querying cinemas with available movies:

```typescript
const cinemasWithMovies = await prisma.cinema.findMany({
  where: {
    city: userCity,
    isActive: true,
  },
  select: {
    id: true,
    name: true,
    address: true,
    movies: {
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        poster: true,
        rating: true,
        certificate: true,
      },
    },
  },
});
```

### Handling Booking Cancellations

For cancelling a booking with refund:

```typescript
await prisma.$transaction(async (tx) => {
  // Update booking status
  const booking = await tx.booking.update({
    where: { id: bookingId },
    data: { 
      status: 'refunded',
      updatedAt: new Date(),
    },
    include: {
      seats: true,
      user: true,
    }
  });
  
  // Release seats
  await tx.seat.updateMany({
    where: { bookingId: bookingId },
    data: { 
      booked: false,
      bookingId: null,
    },
  });
  
  // Record refund transaction
  await tx.transaction.create({
    data: {
      userId: booking.userId,
      amount: booking.totalAmount,
      type: 'refund',
      status: 'success',
      bookingId: booking.id,
    },
  });
  
  // Refund user balance
  await tx.user.update({
    where: { id: booking.userId },
    data: { 
      balance: { increment: booking.totalAmount } 
    },
  });
});
```

## PostgreSQL Extensions

The schema now leverages PostgreSQL extensions for enhanced functionality:

1. **pg_trgm** - For fuzzy text search on movie and cinema names
2. **Full Text Search** - For advanced searching capabilities

### Example of Using Full Text Search

```typescript
const movies = await prisma.$queryRaw`
  SELECT id, name, poster, rating 
  FROM "Movie"
  WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
    @@ to_tsquery('english', ${searchQuery})
    AND "isActive" = true
  ORDER BY ts_rank(to_tsvector('english', name), to_tsquery('english', ${searchQuery})) DESC
  LIMIT 10
`;
```

## Database Security Considerations

1. **Password Storage**: Always hash passwords before storing them
2. **Parameter Validation**: Validate all input parameters before using them in queries
3. **Role-Based Access**: Use the new user role field for access control
4. **Audit Trails**: Leverage the new timestamps and transaction model for auditing

## Performance Monitoring

Consider implementing the following for ongoing performance monitoring:

1. Regular EXPLAIN ANALYZE of common queries
2. Index usage statistics monitoring
3. Connection pool monitoring
4. Query timeout tracking

## Conclusion

The optimized schema provides a more robust foundation for the Movie Booking App with improved performance, data integrity, and scalability. The changes are backward-compatible with existing functionality while adding new capabilities for future development.