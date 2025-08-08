import { createClient } from "redis";
import { PrismaClient } from "@repo/db/client";

// Database connection
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Redis client with enhanced configuration
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff for reconnection attempts
      return Math.min(retries * 50, 3000); // Max 3 seconds between retries
    }
  }
});

// Redis error handling
client.on("error", (err) => {
  console.error("Worker Redis error:", err);
});

// Type definitions for clarity and type safety
interface BookingRequest {
  bookedSeat: number[];
  userId: number;
  startTime: number;
  cinemaId: number;
}

/**
 * Process a transaction to book seats
 * Uses database transaction to ensure data consistency
 * 
 * @param seats - Array of seat IDs to book
 * @param amount - Total price of the seats
 * @param userId - User making the booking
 * @param startTime - Timestamp for the show
 * @param cinemaId - Cinema where booking is made
 */
async function processBookingTransaction(
  seats: number[],
  amount: number,
  userId: number,
  startTime: number,
  cinemaId: number
): Promise<void> {
  // Use a database transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    try {
      // Lock all seats for update to prevent race conditions
      for (const seatId of seats) {
        await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
      }
      
      // Check if any seats are already booked
      const seatStatuses = await tx.seat.findMany({
        where: {
          id: { in: seats },
        },
        select: {
          id: true,
          booked: true,
        },
      });

      // Reject transaction if any seats are unavailable
      const unavailableSeats = seatStatuses.filter(seat => seat.booked);
      if (unavailableSeats.length > 0) {
        throw new Error(`Seats ${unavailableSeats.map(seat => seat.id).join(', ')} are already booked`);
      }
      
      // Check if user exists and has enough balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.balance < amount) {
        throw new Error("Insufficient funds for booking");
      }

      // Get bank account for payment processing
      const bankAccounts = await tx.bank.findMany({ take: 1 });
      if (bankAccounts.length === 0) {
        throw new Error("Bank account not found");
      }
      const movieBookingBank = bankAccounts[0];

      // Process payment: deduct from user and add to bank
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });
      
      await tx.bank.update({
        where: { id: movieBookingBank.id },
        data: { balance: { increment: amount } },
      });
      
      // Mark all seats as booked
      await tx.seat.updateMany({
        where: { id: { in: seats } },
        data: { booked: true },
      });

      console.log(`Transaction successful for user ${userId}, amount ${amount}`);
    } catch (error) {
      console.error("Transaction failed:", error instanceof Error ? error.message : String(error));
      throw error; // Re-throw to trigger transaction rollback
    }
  });
}

/**
 * Create booking records in the database
 * Links seats to the booking record
 * 
 * @param startTime - Timestamp for the show
 * @param seats - Array of seat IDs
 * @param cinemaId - Cinema ID
 * @param userId - User ID making the booking
 */
async function createBookingRecords(
  startTime: number,
  seats: number[],
  cinemaId: number,
  userId: number
): Promise<void> {
  try {
    // Create booking record first
    const booking = await prisma.booking.create({
      data: {
        startTime: new Date(startTime),
        userId,
        cinemaId,
      },
    });

    // Link all seats to the booking in a single query for efficiency
    await prisma.seat.updateMany({
      where: { id: { in: seats } },
      data: { bookingId: booking.id },
    });

    console.log(`Booking #${booking.id} created with ${seats.length} seats for user ${userId}`);
  } catch (error) {
    console.error("Failed to create booking records:", error);
    throw error;
  }
}

/**
 * Process a booking request from the queue
 * Calculates total price and executes the booking transaction
 * 
 * @param bookingData - JSON string containing booking request data
 */
async function processBookingRequest(bookingData: string): Promise<void> {
  try {
    // Parse booking request
    const request: BookingRequest = JSON.parse(bookingData);
    const { bookedSeat: seats, userId, startTime, cinemaId } = request;
    
    // Validate booking data
    if (!seats?.length || !userId || !startTime || !cinemaId) {
      throw new Error("Invalid booking request data");
    }

    // Calculate total booking amount
    let amount = 0;
    const seatDetails = await prisma.seat.findMany({
      where: { id: { in: seats } },
      select: { id: true, price: true },
    });

    // Ensure all requested seats exist
    if (seatDetails.length !== seats.length) {
      throw new Error("Some requested seats do not exist");
    }

    // Calculate total price
    amount = seatDetails.reduce((sum, seat) => sum + seat.price, 0);

    // Process booking transaction
    await processBookingTransaction(seats, amount, userId, startTime, cinemaId);
    await createBookingRecords(startTime, seats, cinemaId, userId);
    
    console.log(
      `Booking completed: ${seats.length} seats for user ${userId} at cinema ${cinemaId} ` +
      `starting at ${new Date(startTime).toISOString()}`
    );
  } catch (error) {
    console.error("Booking processing failed:", error);
    // In a production environment, you might want to implement a retry mechanism
    // or move failed bookings to a dead letter queue for later inspection
  }
}

/**
 * Start the worker process
 * Connects to Redis and processes booking requests from the queue
 */
async function startWorker() {
  try {
    // Connect to Redis
    await client.connect();
    console.log("Redis worker connected successfully");

    // Process graceful shutdown
    setupGracefulShutdown();

    // Main processing loop
    while (true) {
      try {
        // Wait for a booking request
        const result = await client.brPop("bookedSeat", 0);
        
        if (result?.element) {
          console.log(`Processing booking request: ${result.element.substring(0, 50)}...`);
          await processBookingRequest(result.element);
        }
      } catch (error) {
        console.error("Error processing booking from queue:", error);
        // Short pause before trying again to prevent CPU spinning on repeated errors
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("Worker startup error:", error);
    process.exit(1);
  }
}

/**
 * Setup handlers for graceful shutdown
 */
function setupGracefulShutdown() {
  async function shutdown(signal: string) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    try {
      await client.quit();
      await prisma.$disconnect();
      console.log('Connections closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the worker
startWorker();
