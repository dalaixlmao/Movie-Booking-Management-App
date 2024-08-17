"use client";

import Seat from "./Seat";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import Popup from "./Popup";
import selectTheSeats from "@/lib/actions/selectTheSeats";
import PayingAmountButton from "./PayingAmountButton";
import totalSeatAmount from "@/lib/actions/totalSeatAmount";
import getSeat from "@/lib/actions/getSeat";
import CircularLoader from "./CircularLoader";

const lettr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const p = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export default function AuditoriumStructure({ userId }: { userId: number }) {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("cinemaId"));
  const timeStamp = Number(searchParam.get("timeStamp"));
  const [tCols, setTCols] = useState<number>(0);
  const [seats, setSeats] = useState(0);
  const [loader, setLoader] = useState(true);
  const [bookSeats, setBookSeats] = useState<
    {
      id: number;
      row: number;
      col: number;
      audiId: number;
      booked: boolean;
      bookingId: number | null;
      price: number;
    }[]
  >();
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
  const [buttonLoader, setButtonLoader] = useState(false);
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
    if (buttonClicked != 0) {
      setButtonLoader(true);
    }
    async function buttonCl() {
      const response = await axios.post(process.env.EXPRESS_SERVER_URL || "https://my-app.zapto.org", {
        bookedSeats: bookedSeats,
        userId: userId,
        startTime: timeStamp,
        cinemaId: movieId,
      });
      setButtonLoader(false)
    }

    buttonCl();
  }, [buttonClicked]);

  useEffect(() => {
    async function getAudi() {
      const res = await axios.post("/api/booking/slots", {
        movieId: movieId,
        timeStamp: timeStamp,
      });
      setAudi(res.data.audi);
      setTCols((audi ? audi.cols : 0) + 1);
      const audiId = res.data.audi.id;
      const p = await getSeat(audiId);
      setBookSeats(p);
      setLoader(false);
    }
    getAudi();
  }, [timeStamp, movieId]);

  useEffect(() => {
    const bookedSeats = selectTheSeats(audi, selectedSeat, numberOfSeats);
    console.log(bookedSeats);
    setBookedSeats(bookedSeats);
  }, [selectedSeat, audi, numberOfSeats]);

  function onSeatClick() {}
  if (loader || !audi) {
    return (
      <div className="w-full text-white h-full mt-36 flex justify-center items-center">
        <CircularLoader size="10" />
      </div>
    );
  }

  const seatWidth = 100 / audi.cols;


  return (
    <div className="flex justify-center flex-col items-center w-full">
      {popupVisible && (
        <Popup
          setPopupVisible={setPopupVisible}
          setSeats={setNumberOfSeats}
          selectedSeats={numberOfSeats}
          setSelectedSeats={setNumberOfSeats}
        />
      )}

      <div className="mt-7 text-xs font-light text-center">
        <div className="mb-2">All eyes here please!</div>
        <Screen />
      </div>

      <div className="mt-7 flex flex-wrap">
        {bookSeats?.map((elem, index) => (
          <div
            key={index}
            className="flex flex-row justify-center w-fit h-fit items-center my-2"
            style={{ width: `${seatWidth.toString()}%` }}
          >
            {index % audi.cols === 0 && (
              <div className="w-3 text-[8px] md:text-sm text-white/30">
                {lettr[Math.floor(index / audi.cols)]}
              </div>
            )}
            <div
              className={index % audi.cols === 1 ? "ml-1" : ""}
              onClick={() => {
                if (!elem.booked) setSelectedSeat(elem);
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
        ))}
      </div>

      {selectedSeat && (
        <div className="absolute w-full bottom-0 flex flex-col items-center bg-white/10 py-4">
          <PayingAmountButton
            loader={buttonLoader}
            amount={totalSeatAmount(bookedSeats, audi) / 100}
            onClick={() => {
              setButtonClicked((prev) => prev + 1);
            }}
          />
        </div>
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
