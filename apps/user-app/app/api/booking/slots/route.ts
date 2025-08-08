import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";

// Create a single PrismaClient instance and reuse it
const prisma = new PrismaClient();

/**
 * Fetches auditorium data for a specific cinema and time slot
 * 
 * Optimized with efficient query structure and error handling
 * 
 * @param req Request with cinemaId and timeStamp
 * @returns Auditorium data or error response
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { cinemaId, timeStamp } = body;
    
    if (!cinemaId || !timeStamp) {
      return NextResponse.json(
        { error: "Missing required parameters: cinemaId or timeStamp" },
        { status: 400 }
      );
    }
    
    // Convert timestamp to Date object
    const dateTime = new Date(timeStamp);
    
    // Query the database for matching auditorium
    // Using precise indexing via where clause
    const audi = await prisma.audi.findFirst({
      where: {
        cinemaId,
        slots: {
          some: {
            slots: {
              has: dateTime
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        seats: true,
        rows: true,
        cols: true,
      }
    });

    // Handle case when no auditorium is found
    if (!audi) {
      return NextResponse.json(
        { error: "No auditorium found for the specified cinema and time" },
        { status: 404 }
      );
    }

    return NextResponse.json({ audi });
  } catch (error) {
    console.error("Error fetching auditorium data:", error);
    return NextResponse.json(
      { error: "Failed to fetch auditorium data" },
      { status: 500 }
    );
  }
}
