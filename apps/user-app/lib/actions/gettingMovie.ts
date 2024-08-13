"use server";

import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { error } from "console";
const prisma = new PrismaClient();

export default async function gettingMovie(id: number) {
//   const session = await getServerSession(authOptions);
//   const userId = session.user.id;
//   if (!userId) {
//     return {
//       message: "unauthenticated message",
//     };
//   }

const session = await getServerSession(authOptions);
const userId = Number(session.user.id);

const c = await prisma.user.findUnique({
  where:{id:userId},
  select:{city:true}
});

const city = c?.city || "";

  const movie = await prisma.movie.findUnique({
    where: { id: id },
    select:{
        name:true,
        id:true,
        dates:true,
        certificate:true,
        cinemas:{where:{city:city}},
        languages:true,
        rating:true,
        poster:true,
        slots:true
    }
  });
  if (!movie) {
    return { message: "bad request" };
  }

  return movie;
}
