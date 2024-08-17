import BookingMovieDetail from "@/components/BookingMovieDetail";
import BookingDate from "@/components/BookingDate";
import { Suspense } from "react";

export default function Booking() {
  return (
    <div className="text-white">
      <Suspense fallback={<div>Loading...</div>}>
        <BookingMovieDetail />
        <BookingDate />
      </Suspense>
    </div>
  );
}
