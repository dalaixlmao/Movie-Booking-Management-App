"use client";

import { useEffect, useRef, useState } from "react";
import { LegacyRef } from "react";
import CinemaList from "./CinemaList";

const month = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function DateScroll({
  dates,
  setCurrDate,
  currDate,
}: {
  dates: Date[];
  setCurrDate: any;
  currDate: Date;
}) {
  const dateScroll = useRef<any>();
  const [uniqueDate, setUniqueDate] = useState<string[]>();

  useEffect(() => {
    const obj: string[] = [];
    dates.forEach((date) => {
      const dateString = date.toDateString();
      if (!obj.includes(dateString)) {
        obj.push(dateString);
      }
    });
    setUniqueDate(obj);
    if (obj.length > 0) {
      setCurrDate(new Date(obj[0]));
    }
  }, [dates]);

  function onClickLeft(): void {
    const elem = dateScroll.current;
    elem.scrollLeft -= 10;
  }

  function onClickRight(): void {
    const elem = dateScroll.current;
    elem.scrollLeft += 10;
  }

  return (
    <div className="flex flex-row items-center">
      <Left onClick={onClickLeft} />
      <div className="w-1/4 flex flex-row overflow-x-hidden" ref={dateScroll}>
        {uniqueDate?.map((dateString) => {
          const date = new Date(dateString);
          const isCurrentDate = date.toDateString() === currDate.toDateString();
          return (
            <div
              key={date.getTime()}
              onClick={() => {
                setCurrDate(date);
              }}
              className={
                "mr-5 flex flex-col items-center cursor-default group px-2 py-1 " +
                (isCurrentDate
                  ? "bg-red-500 rounded-md"
                  : "bg-transparent hover:text-red-400 font-medium")
              }
            >
              <div
                className={
                  "text-xs " +
                  (isCurrentDate
                    ? "text-white"
                    : "text-white/50 group-hover:text-red-400")
                }
              >
                {day[date.getDay()]}
              </div>
              <div>{date.getDate()}</div>
              <div
                className={
                  "text-xs " +
                  (isCurrentDate
                    ? "text-white"
                    : "text-white/50 group-hover:text-red-400")
                }
              >
                {month[date.getMonth()]}
              </div>
            </div>
          );
        })}
      </div>
      <Right onClick={onClickRight} />
    </div>
  );
}

function Left({ onClick }: { onClick: () => void }) {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6 cursor-pointer"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function Right({ onClick }: { onClick: () => void }) {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6 cursor-pointer"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
