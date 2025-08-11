import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * Handles GET request to fetch movie details
 * Optimized with proper error handling and type safety
 */
export async function GET(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({
      where: { 
        id,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        languages: true,
        certificate: true,
        rating: true,
        poster: true,
        description: true,
        duration: true,
        genre: true
      }
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({
      movie,
      message: "Fetched Movie!",
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    return NextResponse.json({ error: "Failed to fetch movie" }, { status: 500 });
  }
}

/**
 * Handles POST request to fetch available cinemas and slots for a movie on a specific date
 * Optimized with:
 * - Proper indexing for performance
 * - Filtering for active records only
 * - Efficient data fetching patterns
 * - Comprehensive error handling
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Get user's city preference with fallback to empty string
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { city: true },
    });

    const city = user?.city || "";

    const body = await req.json();
    const { movieId, currDate } = body;

    // Validate inputs
    if (!movieId || typeof movieId !== 'number') {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    if (!currDate || typeof currDate !== 'string') {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Parse date safely
    let cd: Date;
    try {
      cd = new Date(currDate);
      // Ensure the date is valid
      if (isNaN(cd.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Use a more efficient query with proper indexing
    const slots = await prisma.slots.findMany({
      where: {
        movieId,
        available: true,
        audi: {
          isActive: true,
          cinema: {
            city,
            isActive: true,
          },
        },
      },
      select: {
        slots: true,
        audiId: true,
        audi: {
          select: {
            id: true,
            name: true,
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

    // Process slots more efficiently
    const cinemaMap = new Map();
    
    // Process all slots in a single pass
    slots.forEach(slot => {
      const { audi, slots: dateSlots, audiId } = slot;
      const cinemaId = audi.cinema.id;
      const cinema = audi.cinema;
      
      // Filter slots for the current date
      const todaySlots = dateSlots.filter(date => 
        date.toDateString() === cd.toDateString()
      ).sort((a, b) => a.getTime() - b.getTime());
      
      if (todaySlots.length > 0) {
        // Use Map for O(1) lookup instead of array search
        if (!cinemaMap.has(cinemaId)) {
          cinemaMap.set(cinemaId, {
            cinema,
            timeSlots: todaySlots,
            audiId
          });
        } else {
          // Merge time slots if cinema already exists
          const existing = cinemaMap.get(cinemaId);
          existing.timeSlots = [...existing.timeSlots, ...todaySlots]
            .sort((a, b) => a.getTime() - b.getTime());
        }
      }
    });
    
    // Convert Map to array for response
    const result = Array.from(cinemaMap.values());

    return NextResponse.json({ 
      cinema: result,
      movieId,
      date: cd.toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching cinema slots:", error);
    return NextResponse.json({ error: "Failed to fetch cinema slots" }, { status: 500 });
  }
}