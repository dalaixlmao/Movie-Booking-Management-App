import { createClient } from "redis";
import { PrismaClient } from "@repo/db/client";

const prisma = new PrismaClient();
const client = createClient();

client.on("error", (e) => {
  console.log("Worker error:", e);
});

async function startTransaction(
  seats: number[],
  amount: number,
  userId: number,
  startTime: number,
  cinemaId: number
) {
  await prisma.$transaction(async (tx) => {
    for (const seatId of seats) {
      await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
    }
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

    const bank = await tx.bank.findMany({});
    const movieBookingBank = bank[0];

    try {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
      await tx.bank.update({
        where: { id: movieBookingBank.id },
        data: { balance: { increment: amount } },
      });
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

async function applyBooking(bookedSeat: string) {
  const elem = JSON.parse(bookedSeat);
  const seats: number[] = elem.bookedSeat;
  const userId = Number(elem.userId);
  const startTime = Number(elem.startTime);
  const cinemaId = Number(elem.cinemaId);

  let amount = 0;
  for (const seatId of seats) {
    const seat = await prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat) {
      console.log("Database error");
    } else {
      amount += seat.price;
    }
  }

  await startTransaction(seats, amount, userId, startTime, cinemaId);
  await createBookings(startTime, seats, cinemaId, userId);
}

async function startWorker() {
  try {
    await client.connect();
    console.log("Redis worker Client connected");

    while (true) {
      try {
        const elem = await client.brPop("bookedSeat", 0);
        console.log("booked", elem);
        if (elem?.element) {
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

startWorker();
