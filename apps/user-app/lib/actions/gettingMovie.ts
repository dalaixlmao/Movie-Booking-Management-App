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
  const movie = await prisma.movie.findUnique({
    where: { id: id },
    select:{
        name:true,
        id:true,
        dates:true,
        certificate:true,
        cinemas:true,
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
