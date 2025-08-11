# Database Transaction Patterns

This document outlines key transaction patterns implemented in the Movie Booking App database to ensure data integrity, consistency, and performance.

## Table of Contents
1. [Booking Transaction Pattern](#booking-transaction-pattern)
2. [Cancellation and Refund Pattern](#cancellation-and-refund-pattern)
3. [Inventory Management Pattern](#inventory-management-pattern)
4. [User Account Operations Pattern](#user-account-operations-pattern)
5. [Batch Operations Pattern](#batch-operations-pattern)
6. [Retry Pattern for Transient Failures](#retry-pattern-for-transient-failures)

## Booking Transaction Pattern

The booking transaction is the most critical operation in the system. It requires coordination between multiple tables to ensure that seats are properly reserved and payments are recorded.

### Implementation

```typescript
/**
 * Books seats for a movie showing with transaction safety
 */
async function bookSeats(userId: number, cinemaId: number, seatIds: number[], startTime: Date) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock selected seats to prevent concurrent booking
    const seatsToBook = await tx.$queryRaw<Seat[]>`
      SELECT * FROM "Seat" 
      WHERE id IN (${Prisma.join(seatIds)}) 
      FOR UPDATE`;
    
    // 2. Validate that all seats are available
    if (seatsToBook.some(seat => seat.booked)) {
      throw new Error('One or more seats are already booked');
    }
    
    // 3. Calculate total price
    const totalPrice = seatsToBook.reduce((sum, seat) => sum + seat.price, 0);
    
    // 4. Check user balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });
    
    if ((user?.balance ?? 0) < totalPrice) {
      throw new Error('Insufficient balance');
    }
    
    // 5. Create booking record
    const booking = await tx.booking.create({
      data: {
        cinemaId,
        userId,
        startTime,
        totalAmount: totalPrice,
        status: 'confirmed',
      }
    });
    
    // 6. Update seats atomically
    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { booked: true, bookingId: booking.id }
    });
    
    // 7. Record transaction
    await tx.transaction.create({
      data: {
        userId,
        amount: totalPrice,
        type: 'payment',
        status: 'success',
        bookingId: booking.id
      }
    });
    
    // 8. Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalPrice } }
    });
    
    return booking;
  }, {
    isolationLevel: 'Serializable' // Highest isolation level
  });
}
```

### Key Considerations

1. **Pessimistic Locking**: Using `FOR UPDATE` locks the selected seats to prevent concurrent bookings
2. **Atomicity**: All operations succeed or fail together
3. **Order of Operations**: Validated seat availability → created booking → updated seats → recorded payment → updated balance
4. **Serializable Isolation**: Prevents transaction anomalies (phantom reads, etc.)

## Cancellation and Refund Pattern

Cancelling a booking requires careful coordination to release seats and process refunds accurately.

### Implementation

```typescript
/**
 * Cancels a booking and processes refund
 */
async function cancelBooking(bookingId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get booking with locking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.status !== 'confirmed') {
      throw new Error(`Cannot cancel booking with status: ${booking.status}`);
    }
    
    // 2. Calculate refund amount based on business rules
    let refundAmount = booking.totalAmount;
    const now = new Date();
    const timeDiff = booking.startTime.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);
    
    // Apply penalties for cancellations close to showtime
    if (hoursRemaining < 24) {
      refundAmount = Math.floor(refundAmount * 0.75); // 25% penalty
    } else if (hoursRemaining < 48) {
      refundAmount = Math.floor(refundAmount * 0.9); // 10% penalty
    }
    
    // 3. Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'refunded' }
    });
    
    // 4. Release seats
    await tx.seat.updateMany({
      where: { bookingId },
      data: { booked: false, bookingId: null }
    });
    
    // 5. Record refund transaction
    await tx.transaction.create({
      data: {
        userId: booking.userId,
        amount: refundAmount,
        type: 'refund',
        status: 'success',
        bookingId: booking.id
      }
    });
    
    // 6. Update user balance
    await tx.user.update({
      where: { id: booking.userId },
      data: { balance: { increment: refundAmount } }
    });
    
    return { booking, refundAmount };
  });
}
```

### Key Considerations

1. **Business Logic**: Refund amount calculations based on timing
2. **Complete Reversal**: All booking effects are reversed (seat booking, payment)
3. **Transaction Record**: Maintains separate records for the original payment and refund for audit purposes

## Inventory Management Pattern

Adding or updating movie inventory (movies, showtimes, etc.) requires maintaining consistency across related tables.

### Implementation

```typescript
/**
 * Adds a new movie with showtimes across multiple cinemas
 */
async function addMovieWithShowtimes(movieData, cinemaIds, showtimes) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the movie
    const movie = await tx.movie.create({
      data: {
        ...movieData,
        cinemas: {
          connect: cinemaIds.map(id => ({ id }))
        }
      }
    });
    
    // 2. Create slots for each cinema/auditorium
    const slotCreations = [];
    
    for (const [cinemaId, audiShowtimes] of Object.entries(showtimes)) {
      for (const [audiId, slots] of Object.entries(audiShowtimes)) {
        slotCreations.push(
          tx.slots.create({
            data: {
              movieId: movie.id,
              audiId: parseInt(audiId),
              slots
            }
          })
        );
      }
    }
    
    // Wait for all slot creations to complete
    await Promise.all(slotCreations);
    
    return movie;
  });
}
```

### Key Considerations

1. **Consistency**: Movie and its showtimes are created in a single atomic operation
2. **Relationship Management**: Properly connects movies to cinemas
3. **Batch Creation**: Creates multiple related records efficiently

## User Account Operations Pattern

Operations that modify user account data, especially those involving financial details, require transaction safety.

### Implementation

```typescript
/**
 * Adds funds to user account with transaction history
 */
async function addFundsToUserAccount(userId: number, amount: number, paymentReference: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify user exists
    const user = await tx.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // 2. Update user balance
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    });
    
    // 3. Record transaction
    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount,
        type: 'deposit',
        status: 'success',
        paymentReference
      }
    });
    
    return { user: updatedUser, transaction };
  });
}
```

### Key Considerations

1. **Data Integrity**: Ensures balance update and transaction record are created together
2. **Audit Trail**: Maintains complete history of financial transactions
3. **Validation**: Verifies user exists before processing

## Batch Operations Pattern

For operations that affect multiple records, batch processing within transactions ensures efficiency and consistency.

### Implementation

```typescript
/**
 * Updates multiple movie prices based on popularity metrics
 */
async function updateMoviePricingTiers(pricingUpdates: Array<{ movieId: number, priceTier: string }>) {
  return await prisma.$transaction(async (tx) => {
    const results = [];
    
    for (const update of pricingUpdates) {
      // Get all seats for showtimes of this movie
      const seats = await tx.seat.findMany({
        where: {
          audi: {
            slots: {
              some: {
                movieId: update.movieId
              }
            }
          }
        }
      });
      
      // Calculate new prices based on tier
      let basePrice: number;
      switch (update.priceTier) {
        case 'premium': basePrice = 1500; break;
        case 'standard': basePrice = 1000; break;
        case 'economy': basePrice = 750; break;
        default: basePrice = 1000;
      }
      
      // Update seats with new prices
      const seatIds = seats.map(seat => seat.id);
      
      // Apply different prices based on seat types
      await tx.seat.updateMany({
        where: { 
          id: { in: seatIds },
          seatType: 'standard'
        },
        data: { price: basePrice }
      });
      
      await tx.seat.updateMany({
        where: { 
          id: { in: seatIds },
          seatType: 'premium'
        },
        data: { price: Math.floor(basePrice * 1.5) }
      });
      
      await tx.seat.updateMany({
        where: { 
          id: { in: seatIds },
          seatType: 'vip'
        },
        data: { price: basePrice * 2 }
      });
      
      results.push({
        movieId: update.movieId,
        priceTier: update.priceTier,
        seatsUpdated: seatIds.length
      });
    }
    
    return results;
  });
}
```

### Key Considerations

1. **Efficiency**: Groups multiple updates in a single transaction
2. **Consistency**: All related updates succeed or fail together
3. **Complex Logic**: Can apply different rules to different record types
4. **Reporting**: Returns detailed results of the operation

## Retry Pattern for Transient Failures

For handling transient database failures, implement a retry pattern with exponential backoff.

### Implementation

```typescript
/**
 * Retry wrapper for database operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 3000,
    backoffFactor = 2,
    retryableErrors = ['P2034', '40001', '40P01'] // Prisma and Postgres error codes
  } = options;
  
  let lastError: Error;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if this is the last attempt
      if (attempt > maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
      }
      
      // Check if error is retryable
      const errorCode = error.code || (error.meta && error.meta.code);
      if (!retryableErrors.includes(errorCode)) {
        throw error;
      }
      
      // Log retry attempt
      console.log(`Attempt ${attempt} failed with error: ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with max delay
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  
  throw lastError;
}

// Example usage
async function bookSeatsWithRetry(userId: number, cinemaId: number, seatIds: number[], startTime: Date) {
  return withRetry(
    () => bookSeats(userId, cinemaId, seatIds, startTime),
    {
      maxRetries: 3,
      initialDelay: 200,
      maxDelay: 2000,
      retryableErrors: ['P2034', '40001'] // Retry on serialization failures
    }
  );
}
```

### Key Considerations

1. **Selective Retrying**: Only retries on specific error types
2. **Exponential Backoff**: Increases delay between retries
3. **Maximum Retries**: Limits the number of attempts
4. **Transparency**: The retry logic is separated from business logic
5. **Logging**: Records retry attempts for monitoring

## Conclusion

These transaction patterns ensure data consistency and integrity throughout the Movie Booking App. By following these patterns, we can handle complex operations safely, maintain accurate financial records, and provide a reliable user experience even under concurrent access conditions.