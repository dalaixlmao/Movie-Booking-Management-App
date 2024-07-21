'use server'

import { PrismaClient } from "@repo/db";
import { date } from "zod";
const prisma = new PrismaClient();


export default async function getttingCinema(
  currentDate: Date,
  movieId: number
) {
    
  const audi = await prisma.slots.findMany({
    where: {
      movieId: movieId,
    },
    select: {
      audi: true,
    },
  });

  const cinemas = audi.map(async (a) => {
    const cine = await prisma.cinema.findMany({
      select: {
        auditoriums: {
          where: {
            id: a.audi.id,
          },
        },
      },
    });

  });
  console.log(cinemas);
  return cinemas
}
