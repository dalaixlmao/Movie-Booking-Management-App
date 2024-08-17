"use client";
import { movieSearchParam } from "@repo/store";
import { useRecoilState, useRecoilValue } from "recoil";
import { useSearchParams } from "next/navigation";
import gettingMovie from "@/lib/actions/gettingMovie";
import axios from "axios";
import { useEffect, useState } from "react";

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

export default function BookingMovieDetail() {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("id"));
  const [latestDate, setLatestDate] = useState("");
  const [loader, setLoader] = useState(true);
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
      setLoader(false);
    }

    getMovie();
  }, [movieId]);
  if(loader)
  {
    return <div role="status" className="mt-12 flex items-center justify-center h-1/4 w-full bg-white/40 rounded-lg animate-pulse dark:bg-white/10">
        <svg className="w-10 h-96 text-white/10 dark:text-white/40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
        <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
        <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM9 13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2Zm4 .382a1 1 0 0 1-1.447.894L10 13v-2l1.553-1.276a1 1 0 0 1 1.447.894v2.764Z"/>
      </svg>
        <span className="sr-only">Loading...</span>
    </div>
    
  }
  return (
    <div className="pt-12">
      <div
        className={`h-1/4 w-full`}
        style={{
          backgroundImage: `url(${movie.poster || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="md:bg-black/60 bg-black backdrop-saturate-0 py-1 h-full w-full md:backdrop-contrast-75">
          <div className="flex md:flex-row flex-col w-full">
            <div
              className="md:h-1/2 block md:mx-0 h-full w-full md:w-48 pt-72 md:ml-36 md:my-5 rounded-xl"
              style={{
                backgroundImage: `url(${movie.poster || ""})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="w-full bg-black text-white text-center border-b border-white/20 md:border-0 text-sm font-light">
                In Cinemas
              </div>
            </div>
            <div className="text-white flex flex-col justify-center mx-4 my-2 md:ml-7">
              <div className="font-bold text-xl md:text-4xl">{movie.name}</div>
              <div className="flex flex-row mt-2">
                {movie.languages.map((lang) => {
                  return (
                    <div
                      key={lang}
                      className="bg-white/70 text-black px-3 py-1 text-sm mr-2 rounded-md"
                    >
                      {lang}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm font-light md:text-md flex flex-row text-xs items-center mt-2">
                {movie.certificate}{" "}
                <div className="rounded-full h-1 w-1 bg-white ml-2 block"></div>
                <div className="text-white ml-2 md:text-md text-xs">
                  {latestDate}
                </div>
                <div className="rounded-full h-1 w-1 bg-white ml-2 text-xs block"></div>
                <div className="ml-2 text-xs flex md:text-md flex-row items-center">
                  {movie.rating}/10 <Star />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="md:size-4 size-4 ml-1"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
