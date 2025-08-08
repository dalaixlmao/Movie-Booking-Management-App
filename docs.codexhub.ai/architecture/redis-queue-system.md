# Redis Queue System for Seat Booking

This document provides a detailed explanation of how the Redis queue system is implemented in the Movie Booking App to handle seat booking transactions.

## System Design

The Redis queue system is designed to solve a critical challenge in online booking systems: preventing double bookings when multiple users try to book the same seats simultaneously. This is achieved through a combination of Redis queues for request serialization and database transactions with row-level locking.

## Components

The queue system involves three main components:

1. **Express Server**: Receives booking requests and adds them to the Redis queue
2. **Redis Queue**: Stores booking requests in a FIFO (First In, First Out) order
3. **Worker Service**: Processes requests from the queue sequentially and updates the database

## Detailed Flow

### 1. Request Submission

When a user selects seats and confirms their booking:

```
┌──────────────┐     ┌────────────────┐     
│              │     │                │     
│   User App   │────▶│ Express Server │     
│  (Next.js)   │     │                │     
│              │     │                │     
└──────────────┘     └───────┬────────┘     
                             │
                             │
                             ▼
                     ┌───────────────┐
                     │  Redis Queue  │
                     │ (bookedSeat)  │
                     │               │
                     └───────────────┘
```

**Code Implementation (Express Server):**

```typescript
// From express-server/src/index.ts
app.post('/', async (req, res) => {
    const bookedSeat = req.body.bookedSeats;
    const userId = req.body.userId;
    const startTime = req.body.startTime;
    const cinemaId = req.body.cinemaId;
    try {
        // Push booking request to Redis queue
        await client.lPush('bookedSeat', JSON.stringify({
            bookedSeat, 
            userId, 
            startTime, 
            cinemaId
        }));
        res.status(200).json({message:'Booking seat request added to queue'});
    }
    catch(e) {
        console.log('Redis pushing error');
        res.status(500).json({message:'Error in sending message to queue'});
    }
})
```

### 2. Queue Processing

The worker service monitors the Redis queue and processes booking requests one at a time:

```
┌───────────────┐     ┌──────────────┐     
│  Redis Queue  │     │    Worker    │     
│ (bookedSeat)  │────▶│   Service    │     
│               │     │              │     
└───────────────┘     └──────┬───────┘     
                             │
                             │
                             ▼
                     ┌──────────────────┐
                     │   PostgreSQL     │
                     │   Database       │
                     │                  │
                     └──────────────────┘
```

**Code Implementation (Worker Service):**

```typescript
// From worker/src/index.ts
async function startWorker() {
  try {
    await client.connect();
    console.log("Redis worker Client connected");

    while (true) {
      try {
        // Block and wait for the next item in the queue
        const elem = await client.brPop("bookedSeat", 0);
        console.log("booked", elem);
        if (elem?.element) {
          // Process the booking request
          await applyBooking(elem.element);
          console.log("Booking processed:", elem);
        }
      } catch (e) {
        console.log("Error in processing booking:", e);
      }
    }
  } catch (e) {
    console.log("Error in connecting worker:", e);
  }
}
```

### 3. Transaction Processing

Each booking request is processed within a database transaction with row-level locking to ensure consistency:

**Code Implementation (Worker Service Transaction):**

```typescript
// From worker/src/index.ts
async function startTransaction(
  seats: number[],
  amount: number,
  userId: number,
  startTime: number,
  cinemaId: number
) {
  await prisma.$transaction(async (tx) => {
    // 1. Lock the rows for the selected seats
    for (const seatId of seats) {
      await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
    }
    
    // 2. Check seat availability
    const seatStatuses = await tx.seat.findMany({
      where: {
        id: { in: seats },
      },
      select: {
        id: true,
        booked: true,
      },
    });

    const unavailableSeats = seatStatuses.filter(seat => seat.booked);
    if (unavailableSeats.length > 0) {
      throw new Error(`Seats ${unavailableSeats.map(seat => seat.id).join(', ')} are already booked`);
    }
    
    // 3. Check user balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        balance: true,
      },
    });

    if (!user) {
      throw new Error("Invalid User Session");
    }

    const balance = user.balance;
    if (balance < amount) {
      throw new Error("Insufficient Funds");
    }

    // 4. Process payment
    const bank = await tx.bank.findMany({});
    const movieBookingBank = bank[0];

    try {
      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
      
      // Update bank balance
      await tx.bank.update({
        where: { id: movieBookingBank.id },
        data: { balance: { increment: amount } },
      });
      
      // Mark seats as booked
      for (const id of seats) {
        await tx.seat.update({
          where: { id: id },
          data: { booked: true },
        });
      }

      console.log("Transaction successful");
    } catch (e) {
      throw new Error("Invalid data provided: " + e);
    }
  });
}
```

### 4. Booking Creation

After successful transaction processing, a booking record is created and seats are associated with it:

```typescript
// From worker/src/index.ts
async function createBookings(
  startTime: number,
  seats: number[],
  cinemaId: number,
  userId: number
) {
  const booking = await prisma.booking.create({
    data: {
      startTime: new Date(startTime),
      userId: userId,
      cinemaId: cinemaId,
    },
  });
  for (const id of seats) {
    const seat = await prisma.seat.update({
      where: { id: id },
      data: {
        booking: {
          connect: { id: booking.id },
        },
      },
    });
  }
  console.log('Seat number', seats, 'are booked');
}
```

## Conflict Prevention

The Redis queue system prevents booking conflicts through:

1. **Sequential Processing**: Requests are processed one at a time, eliminating race conditions.
2. **Row-Level Locking**: Database rows for selected seats are locked during transaction processing.
3. **Availability Verification**: Seat availability is checked within the transaction before proceeding.
4. **ACID Compliance**: All database operations are performed within a transaction that either completes entirely or rolls back.

## Error Handling

The system handles various error conditions:

1. **Unavailable Seats**: If any selected seat is already booked, the transaction fails.
2. **Insufficient Funds**: If the user doesn't have enough balance, the transaction fails.
3. **Database Errors**: Any unexpected database errors cause the transaction to roll back.

## Benefits

1. **Reliability**: Ensures consistent processing of booking requests.
2. **Scalability**: Can handle high volumes of concurrent booking requests.
3. **Data Integrity**: Prevents data corruption through transaction management.
4. **User Experience**: Users receive immediate feedback while booking is processed asynchronously.

## Monitoring and Maintenance

The worker service logs important events during processing, which can be used for monitoring and debugging:

- Queue item received
- Booking processing started
- Transaction successful/failed
- Seats booked

In production environments, these logs should be captured and analyzed to monitor the health of the queue system.

## System Recovery

If the worker service fails or restarts, the Redis queue preserves unprocessed booking requests, which will be processed when the service comes back online. This ensures no booking requests are lost due to service interruptions.