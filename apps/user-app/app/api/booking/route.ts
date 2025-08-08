import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Create a single PrismaClient instance and reuse it
const prisma = new PrismaClient();

/**
 * GET handler for fetching movie details
 * @param req Request object
 * @returns Movie data response
 */
export async function GET(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    
    const movie = await prisma.movie.findUnique({
      where: { id },
    });
    
    return NextResponse.json({
      movie,
      message: "Fetched Movie!",
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for fetching available cinemas and time slots
 * Optimized algorithm with reduced database queries
 * @param req Request object
 * @returns Cinema and time slot data
 */
export async function POST(req: Request) {
  try {
    // Get user session and extract user ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Get user's city preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { city: true },
    });
    const city = user?.city || "";
    
    // Parse request body
    const body = await req.json();
    const { movieId, currDate } = body;
    const selectedDate = new Date(Date.parse(currDate));
    
    // Get the date string for comparison (without time component)
    const selectedDateString = selectedDate.toDateString();
    
    // Query slots with all required data in a single database query
    // This eliminates the need for multiple separate queries later
    const slots = await prisma.slots.findMany({
      where: {
        movieId,
        audi: {
          cinema: { city },
        },
      },
      select: {
        slots: true,
        audiId: true,
        audi: {
          select: {
            id: true,
            cinema: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });
    
    // Create a map to efficiently group slots by cinema
    const cinemaMap = new Map<number, {
      cinema: {
        id: number;
        name: string;
        city: string;
        state: string;
      };
      timeSlots: Date[];
    }>(); 
    
    // Process slots and filter for the selected date
    for (const slot of slots) {
      if (!slot.audi?.cinema) continue;
      
      const cinemaId = slot.audi.cinema.id;
      const todaySlots = slot.slots.filter(slotTime => 
        new Date(slotTime).toDateString() === selectedDateString
      ).sort((a, b) => a.getTime() - b.getTime());
      
      if (todaySlots.length > 0) {
        // Add to existing cinema entry or create new one
        if (cinemaMap.has(cinemaId)) {
          const existingEntry = cinemaMap.get(cinemaId)!;
          existingEntry.timeSlots.push(...todaySlots);
          // Ensure time slots are unique and sorted
          existingEntry.timeSlots = [...new Set(existingEntry.timeSlots)]
            .sort((a, b) => a.getTime() - b.getTime());
        } else {
          cinemaMap.set(cinemaId, {
            cinema: slot.audi.cinema,
            timeSlots: todaySlots,
          });
        }
      }
    }
    
    // Convert map to array for response
    const result = Array.from(cinemaMap.values());
    
    return NextResponse.json({ cinema: result });
  } catch (error) {
    console.error("Error processing cinema slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch cinema slots" },
      { status: 500 }
    );
  }
}
