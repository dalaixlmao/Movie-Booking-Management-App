"use client";

import { Poor_Story } from "next/font/google";


const poorStory = Poor_Story({ subsets: ["latin"], weight:['400'] });


export default function Appbar(): JSX.Element {
  return (
    <div className="flex flex-row justify-between px-4 py-2 border-b-2 border-gray-300">
      <div className={`${poorStory.className} text-lg`}>Movie <a className="text-red-600">Booking</a></div>
      <button className="font-light">Location</button>
      <div className="flex flex-row items-center">
        <div className="h-6 w-6 rounded-full bg-gray-300"></div>
        <div className="ml-2">Hi name</div>
      </div>
    </div>
  );
}
