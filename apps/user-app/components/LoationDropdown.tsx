'use client'

import { useEffect, useState } from "react";
import changeLocation from "@/lib/actions/changeLocation";

export default function LocationDropdown() {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>(["New York", "Los Angeles", "Delhi", "Mumbai", "Kolkata", "Chennai", "Bangaluru", "Chandigarh"]);
  const [city, setCity]=useState("");

  useEffect(() => {
    changeLocation

  }, [open]);

  return (
    <div>
      <div
        className="flex flex-row text-sm items-center"
        onClick={() => {
          setOpen(!open);
        }}
      >
        {city==""?"Select City": city} <Down />{" "}
      </div>
      {open ? (
        <div className="w-48 flex flex-col items-center my-2 bg-black/60 backdrop-blur-lg absolute rounded-md border-white/20 border">
          <div className="w-full flex flex-col items-start text-left ml-[50px] mt-3 mb-3">
          {locations ? (
            locations?.map((elem, index) => {
              return <div key={index} onClick={()=>{changeLocation(elem); setCity(elem);}}  className="w-4/5 text-left hover:bg-white/60 py-1 px-3 ">{elem}</div>;
            })
          ) : (
            <></>
          )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

function Down() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-4 ml-2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}
