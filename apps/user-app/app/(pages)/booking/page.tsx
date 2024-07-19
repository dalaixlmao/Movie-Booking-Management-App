"use client";
import BookingMovieDetail from "@/components/BookingMovieDetail";
import BookingDate from "@/components/BookingDate";

export default function () {
  //   const session: any = await getServerSession();
  //   const userId = Number(session?.user.id);

  return (
    <div className="text-white">
      <BookingMovieDetail />
      <BookingDate />
    </div>
  );
}
