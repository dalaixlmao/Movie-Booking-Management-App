"use client";
import { useSearchParams } from "next/navigation";
import gettingMovie from "@/lib/actions/gettingMovie";
import { useEffect, useState } from "react";
import DateScroll from "./DateScroll";
import CinemaList from "./CinemaList";

type movie = {
  id: number;
  name: string;
  certificate: string;
  rating: string;
  poster: string | null;
  languages: string[];
  dates: Date[];
  cinemas: {
    id: number;
    name: string;
    city: string;
    state: string;
    zip: string;
  }[];
};

export default function BookingDate() {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("id"));
  const [latestDate, setLatestDate] = useState("");
  const [currDate, setCurrDate] = useState(new Date());
  const [movieSlots, setMovieSlot] = useState([new Date]);
  const [movie, setMovie] = useState<movie>({
    id: -1,
    name: "",
    languages: [""],
    certificate: "",
    rating: "",
    dates: [new Date()],
    poster: "",
    cinemas: [
      {
        id: -1,
        name: "",
        city: "",
        state: "",
        zip: "",
      },
    ],
  });
  useEffect(() => {
    async function getMovie() {
      const mov = await gettingMovie(movieId);
      function minDate(dates: Date[]) {
        dates.sort((a: Date, b: Date) => {
          return a.getTime() - b.getTime();
        });
        return dates[0];
      }
      const d:Date[] = [];

      if (mov && typeof mov === "object" && "id" in mov) {
        mov.slots.map((slot) => {
          slot.slots.map((elem) => {
            d.push(elem);
          });
        });
        setMovie(mov);
        setLatestDate(minDate(d).toDateString());
        setMovieSlot(d);
      }
      console.log(mov);
    }

    getMovie();
  }, []);

  return (
    <div className="w-full h-auto">
      <div className="border-b border-t border-white/20">
        <div className="mx-2 md:mx-36 py-5">
          <DateScroll
            dates={movieSlots}
            setCurrDate={setCurrDate}
            currDate={currDate}
          />
        </div>
      </div>
      <div className="md:mx-2 md:mx-36 pt-5 bg-white/10 pb-5">
        <CinemaList currDate={currDate} movieId={movieId} />
      </div>
    </div>
  );
}
