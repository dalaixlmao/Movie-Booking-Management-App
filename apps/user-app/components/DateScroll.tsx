"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LegacyRef } from "react";

// Constants for month and day abbreviations
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Scroll step size in pixels
const SCROLL_STEP = 120;

type DateScrollProps = {
  dates: Date[];
  setCurrDate: (date: Date) => void;
  currDate: Date;
};

/**
 * DateScroll Component
 * 
 * Renders a horizontally scrollable date picker that shows available dates
 * and allows selecting a date for movie showings.
 * 
 * Performance optimized with:
 * - Memoization of derived values
 * - Optimized date processing
 * - Efficient scroll handling
 */
export default function DateScroll({ dates, setCurrDate, currDate }: DateScrollProps) {
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);

  // Process dates to extract unique date strings - done once when dates prop changes
  useEffect(() => {
    // Use a Set for efficient uniqueness checking (O(1) lookup)
    const uniqueDateSet = new Set<string>();
    
    // Process all dates to find unique date strings
    dates.forEach(date => uniqueDateSet.add(date.toDateString()));
    
    // Convert Set back to array
    const uniqueDateArray = Array.from(uniqueDateSet);
    setUniqueDates(uniqueDateArray);
    
    // Set the first date as current if we have dates
    if (uniqueDateArray.length > 0) {
      setCurrDate(new Date(uniqueDateArray[0]));
    }
  }, [dates, setCurrDate]);

  // Scroll handlers optimized with useCallback to prevent unnecessary recreations
  const handleScrollLeft = useCallback(() => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    }
  }, []);
  
  // Current date string for comparison - memoized to prevent recalculation on each render
  const currentDateString = useMemo(
    () => currDate?.toDateString() || '',
    [currDate]
  );

  return (
    <div className="flex flex-row items-center">
      <ScrollButton direction="left" onClick={handleScrollLeft} />
      
      <div 
        className="w-full md:w-1/4 flex flex-row overflow-x-hidden scroll-smooth" 
        ref={dateScrollRef}
      >
        {uniqueDates.map(dateString => {
          const date = new Date(dateString);
          const isCurrentDate = dateString === currentDateString;
          
          // Pre-calculate values used in rendering
          const dayText = DAYS[date.getDay()];
          const dateNum = date.getDate();
          const monthText = MONTHS[date.getMonth()];
          
          return (
            <div
              key={date.getTime()}
              onClick={() => setCurrDate(date)}
              className={`
                mr-5 flex flex-col items-center cursor-pointer group px-4 py-1
                ${isCurrentDate ? "bg-red-500 rounded-md" : "bg-transparent hover:text-red-400 font-medium"}
                transition-colors duration-150
              `}
              role="button"
              aria-pressed={isCurrentDate}
              aria-label={`Select date ${dateString}`}
            >
              <div
                className={`
                  text-xs
                  ${isCurrentDate ? "text-white" : "text-white/50 group-hover:text-red-400"}
                `}
              >
                {dayText}
              </div>
              <div>{dateNum}</div>
              <div
                className={`
                  text-xs
                  ${isCurrentDate ? "text-white" : "text-white/50 group-hover:text-red-400"}
                `}
              >
                {monthText}
              </div>
            </div>
          );
        })}
      </div>
      
      <ScrollButton direction="right" onClick={handleScrollRight} />
    </div>
  );
}

type ScrollButtonProps = {
  direction: 'left' | 'right';
  onClick: () => void;
};

// Memoized scroll buttons to prevent unnecessary re-renders
const ScrollButton = React.memo(({ direction, onClick }: ScrollButtonProps) => {
  const isLeft = direction === 'left';
  
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6 cursor-pointer hover:text-red-400 transition-colors"
      aria-label={`Scroll ${direction}`}
      role="button"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={isLeft ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"}
      />
    </svg>
  );
});
