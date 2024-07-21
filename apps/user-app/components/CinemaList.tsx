"use client";
import { useEffect, useState } from "react";
import getttingCinema from "@/lib/actions/gettingCinema";
import axios from "axios";
export default function CinemaList({
  currDate,
  movieId,
}: {
  currDate: Date;
  movieId: number;
}) {
  const [cinemaSlots, setCinemaSlots] = useState<
    {
      cinema: {
        id: number;
        name: string;
        city: string;
        state: string;
      } | null;
      timeSlots: Date[];
    }[]
  >([]);
  useEffect(() => {
    async function f() {
      const response = await axios.post("/api/booking", {
        movieId: movieId,
        currDate: currDate,
      });
      setCinemaSlots(response.data.cinema);
    }
    f();
  }, [currDate]);
  return (
    <div className="">
      {cinemaSlots.map((elem, index) => {
        return (
          <div key={index} className="w-full flex flex-row items-center justify-between border-b border-white/20 pb-5 px-6">
            <div className="text-sm font-bold w-1/4">{elem.cinema ? elem.cinema.name+", "+elem.cinema.city+", "+elem.cinema.state : ""}</div>
            <div className="flex flex-row w-3/4">
              {elem.timeSlots.map((slot) => {
                const d = new Date(slot);
                return (
                  <div className="flex flex-row border px-5 py-3 text-xs rounded-md mr-3 text-green-400 cursor-pointer">
                    <div>{d.getHours()<10?"0":""}{d.getHours()}</div>
                    <div>:</div>
                    <div>{d.getMinutes()<10?"0":""}{d.getMinutes().toString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
