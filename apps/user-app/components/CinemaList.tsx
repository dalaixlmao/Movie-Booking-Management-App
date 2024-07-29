"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

type Cinema = {
  id: number;
  name: string;
  city: string;
  state: string;
};

type CinemaSlot = {
  cinema: Cinema | null;
  timeSlots: Date[];
};

export default function CinemaList({
  currDate,
  movieId,
}: {
  currDate: Date;
  movieId: number;
}) {
  const router = useRouter();
  const [cinemaSlots, setCinemaSlots] = useState<CinemaSlot[]>([]);

  useEffect(() => {
    const fetchCinemaSlots = async () => {
      try {
        const response = await axios.post("/api/booking", {
          movieId: movieId,
          currDate: currDate,
        });
        setCinemaSlots(response.data.cinema || []);
      } catch (error) {
        console.error("Failed to fetch cinema slots", error);
      }
    };

    fetchCinemaSlots();
  }, [currDate, movieId]);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
  };

  return (
    <div className="">
      {cinemaSlots.length > 0 ? (
        cinemaSlots.map((elem, index) => {
          if(elem.timeSlots.length==0)
            return <></>
          return <div
            key={elem.cinema?.id || index}
            className="px-4 w-full flex flex-col md:flex-row items-center justify-between border-b border-white/20 py-5 md:px-6">
            <div className="text-sm font-bold w-full md:w-1/4">
              {elem.cinema
                ? `${elem.cinema.name}, ${elem.cinema.city}, ${elem.cinema.state}`
                : ""}
            </div>

            <div className="flex flex-row w-full md:w-3/4">
              {elem.timeSlots.map((slot) => {
                const d = new Date(slot);
                return (
                  <div
                    onClick={() => {
                      router.push(
                        `/booking/slots/?cinemaId=${elem.cinema?.id?.toString()}&timeStamp=${d.getTime().toString()}`
                      );
                    }}
                    key={d.getTime()}
                    className="mt-2 md:mt-0 flex flex-row border px-5 py-3 text-xs rounded-md mr-3 text-green-400 cursor-pointer"
                  >
                    <div>{formatTime(d)}</div>
                  </div>
                );
              })}
            </div>
          </div>}
        )
      ) : (
        <div>No cinema slots available</div>
      )}
    </div>
  );
}
