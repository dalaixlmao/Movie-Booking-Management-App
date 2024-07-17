"use client";
import { movieSearchParam } from "@repo/store";
import { useRecoilState, useRecoilValue } from "recoil";
import { useSearchParams } from "next/navigation";
import gettingMovie from "@/lib/actions/gettingMovie";
import axios from 'axios';
import { useEffect } from "react";

export default function BookingMovieDetail() {
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("id"));
  useEffect(()=>{
    async function getMovie(){
        const mov= await gettingMovie(movieId);
        console.log(mov);
    }
    getMovie();
  },[])
  return <div className="pt-12">BookingMovieDetail</div>;
}
