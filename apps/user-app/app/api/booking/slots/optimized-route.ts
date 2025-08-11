import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";

const prisma = new PrismaClient();

/**
 * Handles POST requests to fetch auditorium and seat information for booking
 * Optimized with:
 * - Proper error handling
 * - Input validation
 * - Efficient query patterns
 * - Response optimization
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cinemaId, timeStamp } = body;

    // Validate inputs
    if (!cinemaId || typeof cinemaId !== 'number') {
      return NextResponse.json({ error: "Invalid cinema ID" }, { status: 400 });
    }

    if (!timeStamp || typeof timeStamp !== 'string') {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    // Parse date safely
    let dateTime: Date;
    try {
      dateTime = new Date(timeStamp);
      // Ensure the date is valid
      if (isNaN(dateTime.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid timestamp format" }, { status: 400 });
    }

    // Query optimized with proper indexes
    const audi = await prisma.audi.findFirst({
      where: {
        cinemaId,
        isActive: true,
        slots: {
          some: {
            slots: {
              has: dateTime
            },
            available: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        rows: true,
        cols: true,
        audiType: true,
        capacity: true,
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

    if (!audi) {
      return NextResponse.json({ error: "No auditorium available for the selected time" }, { status: 404 });
    }

    // Structure seat data in a more usable format for the frontend
    const seatMatrix = [];
    for (let r = 0; r < audi.rows; r++) {
      const row = [];
      for (let c = 0; c < audi.cols; c++) {
        const seat = audi.seats.find(s => s.row === r && s.col === c);
        row.push(seat || null);
      }
      seatMatrix.push(row);
    }

    // Calculate seat category statistics
    const seatStats = audi.seats.reduce((acc, seat) => {
      acc[seat.seatType] = (acc[seat.seatType] || 0) + 1;
      return acc;
    }, {});

    // Enhanced response with additional useful data
    return NextResponse.json({
      audi: {
        ...audi,
        seatMatrix,
        seatStats,
        availableSeats: audi.seats.filter(s => !s.booked).length
      }
    });

  } catch (error) {
    console.error("Error fetching auditorium data:", error);
    return NextResponse.json({ error: "Failed to fetch auditorium data" }, { status: 500 });
  }
}

/**
 * Handles PUT requests to book seats
 * Implemented with transaction safety and proper error handling
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { seatIds, userId, startTime } = body;

    // Validate inputs
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "Invalid seat selection" }, { status: 400 });
    }

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (!startTime || typeof startTime !== 'string') {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }

    // Book seats within a transaction for atomicity
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Get seats with FOR UPDATE lock to prevent concurrent booking
      const seats = await tx.$queryRaw`
        SELECT * FROM "Seat" 
        WHERE id IN (${Prisma.join(seatIds)}) 
        FOR UPDATE
      `;

      // 2. Check if any seats are already booked
      const bookedSeats = seats.filter(seat => seat.booked);
      if (bookedSeats.length > 0) {
        throw new Error(`Seats ${bookedSeats.map(s => s.id).join(', ')} are already booked`);
      }

      // 3. Calculate total price
      const totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);

      // 4. Get auditorium and cinema info from first seat
      const seatInfo = await tx.seat.findUnique({
        where: { id: seatIds[0] },
        select: {
          audiId: true,
          audi: { 
            select: { cinemaId: true } 
          }
        }
      });

      if (!seatInfo) {
        throw new Error("Invalid seat selection");
      }

      // 5. Create booking record
      const dateTime = new Date(startTime);
      const booking = await tx.booking.create({
        data: {
          cinemaId: seatInfo.audi.cinemaId,
          userId,
          startTime: dateTime,
          totalAmount: totalPrice,
          status: "confirmed",
        }
      });

      // 6. Update seats
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { booked: true, bookingId: booking.id }
      });

      // 7. Record transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: totalPrice,
          type: "payment",
          status: "success",
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
      isolationLevel: "Serializable" // Highest isolation level for booking integrity
    });

    return NextResponse.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error("Error booking seats:", error);
    
    // Provide specific error message based on error type
    if (error.message?.includes("already booked")) {
      return NextResponse.json({ 
        error: "One or more seats have been taken. Please select different seats." 
      }, { status: 409 }); // Conflict
    }
    
    return NextResponse.json({ 
      error: "Failed to book seats. Please try again." 
    }, { status: 500 });
  }
}