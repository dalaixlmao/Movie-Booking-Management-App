# Database Query Optimization Report

## Table of Contents
1. [Introduction](#introduction)
2. [Current Performance Issues](#current-performance-issues)
3. [Optimization Strategies](#optimization-strategies)
4. [Query-Specific Optimizations](#query-specific-optimizations)
5. [Schema Optimizations](#schema-optimizations)
6. [Recommended Indexes](#recommended-indexes)
7. [Transaction Management](#transaction-management)
8. [Conclusion](#conclusion)

## Introduction

This report outlines the optimization strategies implemented to enhance the performance, security, and scalability of the Movie Booking App database. Our analysis focused on identifying performance bottlenecks and implementing best practices for query optimization.

## Current Performance Issues

Our analysis identified the following performance issues:

1. **Missing Indexes**: Critical queries lacked proper indexing, leading to full table scans
2. **Inefficient JOINs**: Multiple queries joined tables without proper index coverage
3. **N+1 Query Problems**: Fetching related data in loops rather than single queries
4. **Missing Transaction Boundaries**: Critical operations lacked proper transaction handling
5. **Poor Cascade Handling**: Deletion operations potentially left orphaned records
6. **No Timestamp Tracking**: Records lacked proper timestamp tracking

## Optimization Strategies

### General Optimization Principles Applied:

1. **Index Coverage**: Added indexes for all common query patterns and foreign keys
2. **Data Integrity**: Implemented proper constraints, cascading deletes, and transaction boundaries
3. **Query Refactoring**: Optimized JOIN operations and eliminated N+1 query problems
4. **Schema Enhancements**: Added tracking fields, improved relations, and created new models where needed
5. **Performance Monitoring**: Added indexes to support analytics and monitoring

## Query-Specific Optimizations

### 1. Cinema and Slot Fetching Query

**Original Query (from `booking/route.ts`):**
```typescript
const slots = await prisma.slots.findMany({
  where: {
    movieId: movieId,
    audi: {
      cinema: {
        city: city,
      },
    },
  },
  select: {
    slots: true,
    audi: {
      select: {
        cinema: true,
      },
    },
    audiId: true,
  },
});
```

**Optimized Query:**
```typescript
const slots = await prisma.slots.findMany({
  where: {
    movieId: movieId,
    audi: {
      cinema: {
        city: city,
        isActive: true
      },
    },
    available: true
  },
  select: {
    slots: true,
    audi: {
      select: {
        cinema: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        },
        id: true,
        name: true
      },
    },
    audiId: true,
  },
});
```

**Optimizations Applied:**
- Added filtering for `isActive` and `available` to exclude inactive records
- Limited selected fields to only what's needed
- New indexes on `movieId`, `audiId`, and `city` ensure efficient filtering
- Combined indexes on `[movieId, audiId]` optimize the JOIN operation

### 2. Auditorium and Seat Query

**Original Query (from `booking/slots/route.ts`):**
```typescript
const audi = await prisma.audi.findMany({
  where:{
    cinemaId:cinemaId,
    slots:{
      some:{
        slots:{
          has:dateTime
        }
      }
    }
  },
  select:{
    id:true,
    name:true,
    seats:true,
    rows:true,
    cols:true,
  }
});
```

**Optimized Query:**
```typescript
const audi = await prisma.audi.findMany({
  where:{
    cinemaId: cinemaId,
    isActive: true,
    slots:{
      some:{
        slots:{
          has: dateTime
        },
        available: true
      }
    }
  },
  select:{
    id: true,
    name: true,
    rows: true,
    cols: true,
    audiType: true,
    seats: {
      select: {
        id: true,
        row: true,
        col: true,
        booked: true,
        price: true,
        seatType: true
      },
      orderBy: [
        { row: 'asc' },
        { col: 'asc' }
      ]
    }
  }
});
```

**Optimizations Applied:**
- Added filtering for `isActive` to exclude inactive auditoriums
- Limited selected fields from seats to only what's needed
- Added sorting for consistent seat presentation
- New indexes on `[audiId, booked]` make seat status filtering efficient
- Composite index on `cinemaId` and `isActive` improves filter performance

### 3. Booking Creation Transaction

**Original Approach (Implied):**
```typescript
// Separate operations without transaction
const booking = await prisma.booking.create({...});
await prisma.seat.updateMany({
  where: { id: { in: seatIds } },
  data: { booked: true, bookingId: booking.id }
});
// No balance management or transaction records
```

**Optimized Transaction:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create booking record
  const booking = await tx.booking.create({
    data: {
      cinemaId,
      userId,
      startTime: dateTime,
      totalAmount: totalPrice,
      status: "confirmed",
      seats: {
        connect: seatIds.map(id => ({ id }))
      }
    }
  });
  
  // 2. Update seats atomically
  await tx.seat.updateMany({
    where: { id: { in: seatIds } },
    data: { booked: true, bookingId: booking.id }
  });
  
  // 3. Record transaction
  await tx.transaction.create({
    data: {
      userId,
      amount: totalPrice,
      type: "payment",
      status: "success",
      bookingId: booking.id,
      paymentMethod: paymentMethod
    }
  });
  
  // 4. Update user balance
  await tx.user.update({
    where: { id: userId },
    data: { balance: { decrement: totalPrice } }
  });
  
  return booking;
}, {
  isolation: "serializable" // Highest isolation level for booking integrity
});
```

**Optimizations Applied:**
- Wrapped critical operations in a transaction for atomicity
- Added proper error handling and rollbacks for failed operations
- Created transaction history records for audit and tracking
- Used highest isolation level to prevent booking conflicts
- Updated all related records in a single transaction boundary

## Schema Optimizations

The database schema was enhanced with the following optimizations:

1. **Indexing Strategy**: 
   - Added indexes for all foreign keys
   - Created composite indexes for common query patterns
   - Added indexes for status fields and timestamps

2. **Data Integrity Constraints**:
   - Added uniqueness constraints (e.g., `[row, col, audiId]` for seats)
   - Added check constraints for numeric fields (e.g., balance)
   - Implemented proper cascade rules for referential integrity

3. **Timestamps and Auditing**:
   - Added `createdAt` and `updatedAt` fields to all models
   - Created a database trigger to automatically update timestamps
   - Added status fields for tracking record lifecycle

4. **New Models**:
   - Added `Transaction` model for financial tracking
   - Enhanced existing models with additional fields for better data modeling

5. **PostgreSQL Extensions**:
   - Enabled full-text search capabilities
   - Added trigram similarity extension for improved text searches
   - Implemented proper indexes to support these features

## Recommended Indexes

Based on our query analysis, we implemented the following indexes:

```sql
-- Foreign key indexes
CREATE INDEX "Seat_audiId_idx" ON "Seat"("audiId");
CREATE INDEX "Seat_bookingId_idx" ON "Seat"("bookingId");
CREATE INDEX "Audi_cinemaId_idx" ON "Audi"("cinemaId");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_cinemaId_idx" ON "Booking"("cinemaId");
CREATE INDEX "Slots_movieId_idx" ON "Slots"("movieId");
CREATE INDEX "Slots_audiId_idx" ON "Slots"("audiId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_bookingId_idx" ON "Transaction"("bookingId");

-- Composite indexes for common queries
CREATE INDEX "Seat_audiId_booked_idx" ON "Seat"("audiId", "booked");
CREATE INDEX "Booking_userId_startTime_idx" ON "Booking"("userId", "startTime");
CREATE INDEX "Booking_cinemaId_startTime_idx" ON "Booking"("cinemaId", "startTime");
CREATE INDEX "Slots_movieId_audiId_idx" ON "Slots"("movieId", "audiId");

-- Status and filter indexes
CREATE INDEX "Movie_isActive_idx" ON "Movie"("isActive");
CREATE INDEX "Audi_isActive_idx" ON "Audi"("isActive");
CREATE INDEX "Cinema_isActive_idx" ON "Cinema"("isActive");
CREATE INDEX "Cinema_city_idx" ON "Cinema"("city");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- Timestamp indexes for reporting
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
```

## Transaction Management

We implemented proper transaction boundaries for all critical operations, particularly:

1. **Booking Creation**:
   - Seat reservation, booking creation, and payment in one atomic operation
   - Prevents race conditions when multiple users try to book the same seats

2. **Booking Cancellation/Refund**:
   - Updates booking status, releases seats, and handles refunds atomically
   - Maintains financial consistency across the system

3. **Inventory Updates**:
   - Cinema, auditorium, and movie updates are handled in transactions
   - Prevents inconsistent state between related records

4. **User Management**:
   - Balance updates and transaction recording in a single atomic operation
   - Maintains user financial consistency

## Conclusion

The implemented optimizations significantly enhance the database performance, security, and scalability of the Movie Booking App. Key improvements include:

1. **Performance**: Proper indexing and query optimization reduce query times
2. **Data Integrity**: Enhanced constraints and transaction boundaries ensure consistency
3. **Scalability**: Optimized schema design allows for future growth
4. **Auditability**: New transaction model and timestamps improve tracking
5. **Security**: Proper validation and constraints prevent data corruption

These changes lay a solid foundation for future growth while ensuring the system remains performant under increasing load.