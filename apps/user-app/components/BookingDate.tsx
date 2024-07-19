"use client";
import { useSearchParams } from "next/navigation";
import gettingMovie from "@/lib/actions/gettingMovie";
import { useEffect, useState } from "react";
import DateScroll from "./DateScroll";


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


export default function BookingDate(){

    const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("id"));
  const [latestDate, setLatestDate] = useState("");
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
      if (mov && typeof mov === "object" && "id" in mov) {
        setMovie(mov);
        setLatestDate(minDate(mov.dates).toDateString());
      }
      console.log(mov);
    }

    getMovie();
  }, []);


    return <div className="border-b border-t border-white/10">
       <div className="mx-36 py-5"><DateScroll dates={movie.dates}/></div> 
        </div>
}