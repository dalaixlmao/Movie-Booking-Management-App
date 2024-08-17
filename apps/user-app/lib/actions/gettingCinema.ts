'use server'

import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { date } from "zod";
import { authOptions } from "../auth";
const prisma = new PrismaClient();


export default async function getttingCinema(
  currentDate: Date,
  movieId: number
) {
    const session = await getServerSession(authOptions);
    const id = Number(session.user.id);

    const c = await prisma.user.findUnique({
      where:{id:id},
      select:{city:true}
    });

    const city = c?.city || "";

  const audi = await prisma.slots.findMany({
    where: {
      movieId: movieId,
    },
    select: {
      audi: true,
    },
  });

  const cinemas = audi.map(async (a:{
    audi: {
        id: number;
        rows: number;
        cols: number;
        name: string;
        cinemaId: number;
    };
}) => {
    const cine = await prisma.cinema.findMany({
      where:{city:city},
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
