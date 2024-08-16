"use client";
import BookingMovieDetail from "@/components/BookingMovieDetail";
import BookingDate from "@/components/BookingDate";
import { useState } from "react";

export default function Booking() {

  return (
    <div className="text-white">
      <BookingMovieDetail />
      <BookingDate />
    </div>
  );
}
