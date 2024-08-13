import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const prisma = new PrismaClient();
export async function GET(req: Request) {
  const body = await req.json();
  const id = body.id;
  const movie = await prisma.movie.findUnique({
    where: { id: id },
  });
  return NextResponse.json({
    movie: movie,
    message: "Fetched Movie!",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const userId = Number(session.user.id);

  const c = await prisma.user.findUnique({
    where: { id: userId },
    select: { city: true },
  });

  const city = c?.city || "";

  const body = await req.json();
  const movieId = body.movieId;
  const currDate: string = body.currDate;
  const cd: Date = new Date(Date.parse(currDate));
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
  

  const obj: { audiId: number; timeSlots: Date[] }[] = [];
  const audi: number[] = [];
  slots.map((slot: { audiId: number; slots: Date[]; audi: any }) => {
    const todaySlots: Date[] = [];
    slot.slots.map((e: Date) => {
      if (e.toDateString() == cd.toDateString()) {
        todaySlots.push(e);
        if (!audi.includes(slot.audiId)) audi.push(slot.audiId);
      }
    });
    todaySlots.sort((a: Date, b: Date) => {
      return a.getTime() - b.getTime();
    });
    obj.push({ audiId: audi[audi.length - 1], timeSlots: todaySlots });
  });

  console.log(obj);
  // cinemaId
  // Cinema Name
  // Slots = date[]

  async function getCinemas(audi: number[]) {
    const cinema = [];

    for (const a of obj) {
      const auditorium = await prisma.audi.findUnique({
        where: { id: a.audiId },
        select: { cinemaId: true },
      });

      if (auditorium && auditorium.cinemaId) {
        const cine = await prisma.cinema.findUnique({
          where: { id: auditorium.cinemaId, city },
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        });
        cinema.push({ cinema: cine, timeSlots: a.timeSlots });
      }
    }
    return cinema;
  }

  const result = await getCinemas(audi);

  return NextResponse.json({ cinema: result });
}
