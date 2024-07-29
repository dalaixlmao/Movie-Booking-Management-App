"use client";

import Seat from "./Seat";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { toASCII } from "punycode";
import Popup from "./Popup";
import selectTheSeats from "@/lib/actions/selectTheSeats";
import PayingAmountButton from "./PayingAmountButton";
import totalSeatAmount from "@/lib/actions/totalSeatAmount";

const lettr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const p = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export default function AuditoriumStructure({userId}:{userId:number}) {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("cinemaId"));
  const timeStamp = Number(searchParam.get("timeStamp"));
  const [tCols, setTCols] = useState<number>(0);
  const [seats, setSeats] = useState(0);
  const [popupVisible, setPopupVisible] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<{
    id: number;
    row: number;
    col: number;
    audiId: number;
    booked: boolean;
    bookingId: number | null;
    price: number;
  }>();
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [bookedSeats, setBookedSeats] = useState([-1]);
  const [buttonClicked, setButtonClicked] = useState(0);
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


  useEffect(()=>{
    async function buttonCl(){
      console.log('button CLicked-----------------------------------------')
      const response = await axios.post('http://localhost:8080/',{
        bookedSeats:bookedSeats,
        userId:userId,
        startTime:timeStamp,
        cinemaId:movieId
      })
      console.log(response.data);

    }
    buttonCl();
  },[buttonClicked]);


  useEffect(() => {
    async function getAudi() {
      const res = await axios.post("/api/booking/slots", {
        movieId: movieId,
        timeStamp: timeStamp,
      });
      setAudi(res.data.audi);
      setTCols((audi ? audi.cols : 0) + 1);
    }
    getAudi();
  }, [timeStamp, movieId]);

  useEffect(() => {
    const bookedSeats = selectTheSeats(audi, selectedSeat, numberOfSeats);
    console.log(bookedSeats);
    setBookedSeats(bookedSeats);
  }, [selectedSeat]);

  function onSeatClick() {}
  return (
    <div className="flex justify-center flex-col items-center w-full">
      {popupVisible ? (
        <Popup
          setPopupVisible={setPopupVisible}
          setSeats={setSeats}
          selectedSeats={numberOfSeats}
          setSelectedSeats={setNumberOfSeats}
        />
      ) : (
        <></>
      )}
      <div className="mt-7 text-xs font-light text-center">
        <div className="mb-2">All eyes here please!</div>
        <Screen />
      </div>
      <div
        className={`md:gap-y-3 gap-0 mt-7 grid grid-cols-[repeat(${audi?.cols.toString()},1fr)]`}
      >
        {audi?.seats.map((elem, index) => {
          return (
            <div key={index} className="flex flex-row justify-between w-fit h-fit">
                {index % audi.cols == 0 ? <div className="w-3 text-[8px] md:text-sm text-white/30">{lettr[index / audi.cols]}</div> :<div className="w-0 h-0"></div>}
              <div
              className={(index%audi.cols==1)?"ml-1":""}
                onClick={() => {
                  setSelectedSeat(elem);
                }}
              >
                <Seat
                  onClick={onSeatClick}
                  seat={elem}
                  totalCols={audi.cols}
                  isSelected={bookedSeats.includes(elem.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
      {selectedSeat ? (
        <div className="absolute w-full bottom-0 flex flex-col items-center bg-white/10 py-4">
          <PayingAmountButton
            amount={totalSeatAmount(bookedSeats, audi) / 100}
            onClick={()=>{setButtonClicked((p)=>p+1)}}
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

function Screen() {
  return (
    <svg
      width="200"
      height="10"
      viewBox="0 0 521 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M521 46L413 0H108L0 46H521Z" fill="white" opacity="0.2" />
    </svg>
  );
}
