"use client";

import React, { useState, useEffect } from "react";

const Carousel = ({
  movies,
}: {
  movies: {
    id: number;
    name: string;
    languages: string[];
    certificate: string;
    rating: string;
    dates: Date[];
    poster: string | null;
  }[];
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [poster, posterUrls] = useState([""]);
  const slides = movies.map((elem) => {
    return elem.poster;
  });

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="default-carousel"
      className="md:border-0 border-2 relative md:w-screen h-4/5 w-4/5 md:h-screen bg-black md:p-0 pt-8"
      data-carousel="slide"
    >
      {/* Carousel wrapper */}
      <div className="relative h-full overflow-hidden bg-black md:h-full">
        {movies.map((movie, index) => (
          <div
            key={index}
            className={`duration-700 h-full w-full ease-in-out overflow-hidden ${
              currentSlide === index ? "block" : "hidden"
            }`}
            data-carousel-item
          >
            <img
              src={movie.poster || ""}
              className="size-full absolute block md:w-full md:h-auto w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              alt={`Slide ${index + 1}`}
            />

            <div className="absolute z-40 bottom-0 md:ml-48 md:mb-24 ">
              <div className="text-red-500 font-black md:text-9xl hover:cursor-default">
                {movie.name}
              </div>
              <div className="text-white flex flex-row mt-6">
                <div className="text-white hover:cursor-default bg-white/50 px-4 py-2 rounded-lg mt-3 text-white font-medium backdrop-blur-md flex flex-row justify-between items-center">
                  Rating {movie.rating}/10 <Star />
                </div>
                <button className="text-white md:bg-white px-4 py-2 rounded-lg mt-3 md:text-black font-medium ml-3 hover:bg-white/80 hover:backdrop-blur-md">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slider controls */}
      <button
        type="button"
        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-prev
        onClick={prevSlide}
      >
        <span className="inline-flex items-center justify-center md:w-10 md:h-10 w-5 h-5 rounded-full bg-white/30 dark:bg-gray-500/30 group-hover:bg-white/50 dark:group-hover:bg-gray-500/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg
            className="md:w-4 md:h-4 w-2 h-2 text-white dark:text-gray-500 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1L1 5l4 4"
            />
          </svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>
      <button
        type="button"
        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-next
        onClick={nextSlide}
      >
        <span className="inline-flex items-center justify-center md:w-10 md:h-10 w-5 h-5 rounded-full bg-white/30 dark:bg-gray-500/30 group-hover:bg-white/50 dark:group-hover:bg-gray-500/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg
            className="md:w-4 md:h-4 w-2 h-2 text-white dark:text-gray-500 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  );
};

export default Carousel;

function Star() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-5 ml-1"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
