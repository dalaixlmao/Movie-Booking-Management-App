import Carousel from "@/components/Carousel";
import { PrismaClient } from "@repo/db";
const prisma = new PrismaClient();

export default async function () {
    const movies = await prisma.movie.findMany({});

    const movieType = typeof(movies[0]);

  return (
    <div className="h-full">
      <div className="h-full bg-black flex flex-col items-center justify-center"><Carousel movies = {movies}/></div>
    </div>
  );
}
