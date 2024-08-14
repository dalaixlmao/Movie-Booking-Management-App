import Carousel from "@/components/Carousel";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation"; // Import redirect function for server-side redirects
import Link from "next/link";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }
  const movies = await prisma.movie.findMany();

  if (!movies.length) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <h2>No movies available</h2>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-full bg-black flex flex-col items-center justify-center">
        <Carousel movies={movies} />
      </div>
    </div>
  );
}
