"use client";

import Seat from "./Seat";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { toASCII } from "punycode";

const lettr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export default function AuditoriumStructure() {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("cinemaId"));
  const timeStamp = Number(searchParam.get("timeStamp"));
  const [tCols, setTCols] = useState<number>(0);
  const [rowNumber, setRowNumber] = useState<number>(0);
  const [audi, setAudi] = useState<{
    id: number;
    rows: number;
    cols: number;
    name: string;
    seats: {
      id: number;
      row: number;
      col: number;
      audiId: number;
      booked: boolean;
      bookingId: number | null;
      price: number;
    }[];
  }>();

  useEffect(() => {
    async function getAudi() {
      const res = await axios.post("/api/booking/slots", {
        movieId: movieId,
        timeStamp: timeStamp,
      });
      console.log(res.data.audi);
      setAudi(res.data.audi);
      setTCols((audi ? audi.cols : 0) + 1);
    }
    getAudi();
  }, [timeStamp, movieId]);

  return (
    <div className="flex justify-center flex-col items-center w-full">
        <div className="mt-7 text-xs font-light text-center">
           <div className="mb-2">All eyes here please!</div>
        <Screen /></div>
      <div className={`gap-y-3 mt-3 grid grid-cols-${audi?.cols.toString()}`}>
        {audi?.seats.map((elem, index) => {
          console.log(`gap grid grid-cols-${audi?.cols}`);
          return (
            <div key={index} className="flex flex-row justify-between">
              <div className="mr-2 text-sm text-white/30">
                {index % audi.cols == 0 ? lettr[index / audi.cols] : ""}
              </div>
                <Seat seat={elem} totalCols={audi.cols} />
            </div>
          );
        })}
      </div>
    </div>
  );
}



function Screen(){
    return <svg width="200" height="10" viewBox="0 0 521 46" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M521 46L413 0H108L0 46H521Z" fill="white" opacity='0.2'/>
    </svg>    
}