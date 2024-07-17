"use client";

import { Poor_Story } from "next/font/google";


const poorStory = Poor_Story({ subsets: ["latin"], weight:['400'] });


export default function Appbar(): JSX.Element {
  return (
    <div className="flex flex-row justify-between text-white px-4 py-2 absolute backdrop-blur-lg bg-black/60  w-full z-50">
      <div className={`${poorStory.className} text-2xl text-red-400`}>Movie <a className="">Booking</a></div>
      <button className="font-light text-white/50 hover:text-white hover:font-regular">Location</button>
      <div className="flex flex-row items-center">
        <div className="h-6 w-6 rounded-full bg-gray-300"></div>
        <div className="ml-2">name</div>
      </div>
    </div>
  );
}
