'use server'
import { PrismaClient } from "@repo/db/client";
const prisma = new PrismaClient();

export default async function getSeat(audiId: number) {
  const seats = await prisma.seat.findMany({
    where:{audiId},
    orderBy:{id:'asc'}
  })
  return seats;
}
