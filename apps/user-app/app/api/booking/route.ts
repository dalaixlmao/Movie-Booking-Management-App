import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db";
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
  const body = await req.json();
  const movieId = (body.movieId);
  const currDate:string = body.currDate;
  const cd: Date = new Date(Date.parse(currDate));
  const slots = await prisma.slots.findMany({
    where: {
      movieId: movieId,
    },
    select: {
      slots: true,
      audi: true,
      audiId: true,
    },
  });


  const obj:{audiId:number, timeSlots:Date[]}[] = []
  const audi: number[] = [];
  slots.map((slot) => {
    const todaySlots: Date[] = [];
    slot.slots.map((e) => {
      if (e.toDateString() == cd.toDateString()) {
        todaySlots.push(e);
        if(!audi.includes(slot.audiId))
        audi.push(slot.audiId);
      }
    },
  );
  obj.push({audiId:audi[audi.length-1], timeSlots:todaySlots})
  });

  console.log(obj);
  // cinemaId
  // Cinema Name
  // Slots = date[]



  async function getCinemas(audi:number[]) {
    const cinema = [];
    
    for (const a of obj) {
      const auditorium = await prisma.audi.findUnique({
        where: { id: a.audiId },
        select: { cinemaId: true }
      });
      
      if (auditorium && auditorium.cinemaId) {
        const cine = await prisma.cinema.findUnique({
          where: { id: auditorium.cinemaId },
          select: {
            id: true,
            name: true,
            city:true, 
            state:true,
          }
        });
        cinema.push({cinema:cine, timeSlots:a.timeSlots});
      }
    }
    return cinema;
  }

  const result = await getCinemas(audi);

  return NextResponse.json({ cinema: result});
}
