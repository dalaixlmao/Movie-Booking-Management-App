# Database Transaction Management Guide

## Overview

This document outlines best practices for implementing transaction management in the Movie Booking App database. Proper transaction management is critical for maintaining data integrity, particularly for operations like seat booking, where concurrent users might attempt to reserve the same seats.

## Critical Transaction Scenarios

### 1. Seat Booking Process

The seat booking process is one of the most critical transaction scenarios in the system. It requires coordinating multiple operations:

- Checking seat availability
- Locking selected seats
- Creating booking records
- Recording payment transactions
- Updating user balances

**Implementation with Serializable Isolation:**

```typescript
/**
 * Books seats for a movie showing with proper transaction handling
 * @param userId User making the booking
 * @param cinemaId Cinema where the showing is taking place
 * @param movieId Movie being shown
 * @param seatIds Array of seat IDs to book
 * @param startTime Showing start time
 * @returns Booking record if successful
 * @throws Error if seats are already booked or other transaction issues
 */
async function bookSeats(
  userId: number,
  cinemaId: number, 
  movieId: number,
  seatIds: number[], 
  startTime: Date
): Promise<Booking> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify user has sufficient balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      
      // 2. Get seats with pessimistic locking
      // Using a raw query with FOR UPDATE to lock the rows
      const seatsToBook = await tx.$queryRaw<Seat[]>`
        SELECT * FROM "Seat" 
        WHERE id IN (${Prisma.join(seatIds)}) 
        FOR UPDATE`;
      
      // 3. Check if any seats are already booked
      const bookedSeats = seatsToBook.filter(seat => seat.booked);
      if (bookedSeats.length > 0) {
        throw new Error(`Seats ${bookedSeats.map(s => s.id).join(', ')} are already booked`);
      }
      
      // 4. Calculate total price
      const totalPrice = seatsToBook.reduce((sum, seat) => sum + seat.price, 0);
      
      // 5. Verify user has sufficient balance
      if ((user?.balance ?? 0) < totalPrice) {
        throw new Error('Insufficient balance');
      }
      
      // 6. Create booking record
      const booking = await tx.booking.create({
        data: {
          cinemaId,
          userId,
          startTime,
          totalAmount: totalPrice,
          status: 'confirmed',
        },
      });
      
      // 7. Update seats atomically
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { booked: true, bookingId: booking.id }
      });
      
      // 8. Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          amount: totalPrice,
          type: 'payment',
          status: 'success',
          bookingId: booking.id,
          paymentReference: `BOOKING-${booking.id}`
        }
      });
      
      // 9. Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalPrice } }
      });
      
      return booking;
    }, {
      maxWait: 5000, // 5 seconds max wait time
      timeout: 10000, // 10 seconds transaction timeout
      isolationLevel: 'Serializable' // Highest isolation level
    });
  } catch (error) {
    console.error('Booking transaction failed:', error);
    throw new Error(`Booking failed: ${error.message}`);
  }
}
```

### 2. Booking Cancellation and Refund

Booking cancellation requires similar transaction safety to ensure that:

- Seats are properly released
- Refund is processed exactly once
- User balance is updated correctly
- All records are kept in sync

**Implementation:**

```typescript
/**
 * Cancels a booking and processes refund within a transaction
 * @param bookingId The booking to cancel
 * @param reason Optional cancellation reason
 * @returns Updated booking record
 */
async function cancelBooking(bookingId: number, reason?: string): Promise<Booking> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get booking with locking
      const booking = await tx.$queryRaw<Booking[]>`
        SELECT * FROM "Booking" 
        WHERE id = ${bookingId} 
        FOR UPDATE`;
        
      if (booking.length === 0) {
        throw new Error('Booking not found');
      }
      
      const bookingRecord = booking[0];
      
      // 2. Check if booking is already cancelled or refunded
      if (bookingRecord.status !== 'confirmed') {
        throw new Error(`Cannot cancel booking with status: ${bookingRecord.status}`);
      }
      
      // 3. Get associated seats
      const seats = await tx.seat.findMany({
        where: { bookingId }
      });
      
      // 4. Calculate refund amount (may include penalties based on business rules)
      const refundAmount = bookingRecord.totalAmount;
      
      // 5. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'refunded',
          updatedAt: new Date()
        }
      });
      
      // 6. Release seats
      await tx.seat.updateMany({
        where: { bookingId },
        data: { 
          booked: false, 
          bookingId: null 
        }
      });
      
      // 7. Record refund transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: bookingRecord.userId,
          amount: refundAmount,
          type: 'refund',
          status: 'success',
          bookingId,
          paymentReference: `REFUND-${bookingId}`
        }
      });
      
      // 8. Update user balance
      await tx.user.update({
        where: { id: bookingRecord.userId },
        data: { balance: { increment: refundAmount } }
      });
      
      return await tx.booking.findUnique({
        where: { id: bookingId },
        include: { 
          cinema: true,
          user: { 
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }, {
      isolationLevel: 'Serializable'
    });
  } catch (error) {
    console.error('Refund transaction failed:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
}
```

### 3. Inventory Management (Adding/Removing Movies, Showtimes)

When updating the movie inventory, you need to maintain consistency between:

- Movies
- Cinemas
- Showtimes
- Auditoriums

**Implementation:**

```typescript
/**
 * Adds a new movie with showtimes to the system
 * @param movieData Movie details
 * @param cinemaIds Cinemas where the movie will show
 * @param showtimes Map of cinemaId -> audiId -> DateTime[]
 */
async function addMovieWithShowtimes(
  movieData: MovieCreateInput,
  cinemaIds: number[],
  showtimes: Record<number, Record<number, Date[]>>
): Promise<Movie> {
  return await prisma.$transaction(async (tx) => {
    // 1. Create movie
    const movie = await tx.movie.create({
      data: {
        ...movieData,
        cinemas: {
          connect: cinemaIds.map(id => ({ id }))
        }
      }
    });
    
    // 2. Create slots for each cinema and auditorium
    for (const [cinemaId, audiMap] of Object.entries(showtimes)) {
      for (const [audiId, slotTimes] of Object.entries(audiMap)) {
        await tx.slots.create({
          data: {
            movieId: movie.id,
            audiId: Number(audiId),
            slots: slotTimes,
            available: true
          }
        });
      }
    }
    
    return movie;
  });
}
```

## Transaction Isolation Levels

The system uses different transaction isolation levels based on the operation's criticality:

1. **Serializable**: Used for seat booking and refunds to prevent race conditions
2. **Repeatable Read**: Used for inventory management
3. **Read Committed**: Used for reporting and analytics

## Error Handling and Retry Strategies

For mission-critical operations, implement error handling with retry logic:

```typescript
/**
 * Retry wrapper for transaction functions
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param delay Initial delay between retries (ms)
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 500
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on specific error types (e.g., deadlocks, serialization failures)
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`Retry attempt ${attempt} after error: ${error.message}`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError;
}

/**
 * Determines if an error should trigger a retry
 */
function isRetryableError(error: any): boolean {
  // Postgres serialization failure
  if (error.code === '40001') return true;
  
  // Deadlock detected
  if (error.code === '40P01') return true;
  
  // Prisma specific errors that might be retryable
  if (error.code === 'P2034') return true; // Transaction failed due to a serialization error
  
  return false;
}
```

## Transaction Monitoring

To monitor transaction performance and identify issues:

1. **Logging Key Transaction Points**:

```typescript
async function monitoredTransaction<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Log successful transaction
    console.log(`Transaction ${name} completed in ${duration}ms`);
    
    // For long-running transactions, emit metrics
    if (duration > 1000) {
      console.warn(`Long transaction ${name}: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed transaction
    console.error(`Transaction ${name} failed after ${duration}ms: ${error.message}`);
    
    throw error;
  }
}
```

2. **Deadlock Detection**:

Implement a deadlock detection system that monitors transaction times and identifies potential deadlocks before they cause system-wide issues.

## Performance Considerations

To optimize transaction performance:

1. **Keep transactions short**: Avoid long-running transactions
2. **Minimize the transaction scope**: Include only necessary operations
3. **Order operations consistently**: Access tables in the same order to reduce deadlock chances
4. **Use proper indexes**: Ensure all queries within transactions use indexes
5. **Monitor lock contention**: Track and resolve areas with high lock contention

## Common Pitfalls to Avoid

1. **Nested transactions**: Avoid nesting transaction calls
2. **Mixing transaction boundaries**: Keep all related operations in the same transaction
3. **External API calls within transactions**: Don't make network requests inside transactions
4. **Over-isolation**: Don't use Serializable when a lower isolation level would suffice
5. **Missing error handling**: Always handle transaction failures gracefully

## Conclusion

Implementing proper transaction management is critical for the Movie Booking App's reliability and data integrity. By following these guidelines, you can ensure that concurrent operations like seat bookings proceed safely without data corruption or inconsistency.