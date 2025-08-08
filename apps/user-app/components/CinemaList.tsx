"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Type definitions
type Cinema = {
  id: number;
  name: string;
  city: string;
  state: string;
};

type CinemaSlot = {
  cinema: Cinema | null;
  timeSlots: Date[];
};

type CinemaListProps = {
  currDate: Date;
  movieId: number;
};

/**
 * CinemaList Component
 * 
 * Displays a list of available cinemas with their screening time slots for a selected date.
 * Optimized for performance with memoization and efficient data handling.
 */
export default function CinemaList({ currDate, movieId }: CinemaListProps) {
  const router = useRouter();
  const [cinemaSlots, setCinemaSlots] = useState<CinemaSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Format time helper - memoized to prevent recreation on each render
  const formatTime = useCallback((date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
  }, []);

  // Fetch cinema slots when date or movie changes
  const fetchCinemaSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/booking", {
        movieId,
        currDate,
      });
      setCinemaSlots(response.data.cinema || []);
    } catch (error) {
      console.error("Failed to fetch cinema slots", error);
    } finally {
      setIsLoading(false);
    }
  }, [currDate, movieId]);

  // Trigger fetch on component mount or dependencies change
  useEffect(() => {
    fetchCinemaSlots();
  }, [fetchCinemaSlots]);

  // Navigate to slot selection page with the selected cinema and time
  const navigateToSlot = useCallback((cinemaId: number | undefined, timestamp: number) => {
    if (!cinemaId) return;
    router.push(`/booking/slots/?cinemaId=${cinemaId}&timeStamp=${timestamp}`);
  }, [router]);

  // Filter out entries with no time slots - computed once when cinemaSlots changes
  const filteredCinemaSlots = useMemo(() => {
    return cinemaSlots.filter(slot => slot.timeSlots && slot.timeSlots.length > 0);
  }, [cinemaSlots]);

  // Show skeleton loader while fetching data
  if (isLoading) {
    return (
      <div role="status" className="animate-pulse">
        <div className="h-20 bg-white/20 dark:bg-white/10 w-full py-5 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredCinemaSlots.length > 0 ? (
        filteredCinemaSlots.map((cinemaSlot) => {
          const { cinema, timeSlots } = cinemaSlot;
          const cinemaId = cinema?.id;
          
          return (
            <div
              key={cinemaId || `cinema-${Math.random()}`}
              className="px-4 w-full flex flex-col md:flex-row items-center justify-between border-b border-white/20 py-5 md:px-6"
            >
              {/* Cinema details */}
              <div className="text-sm font-bold w-full md:w-1/4 mb-3 md:mb-0">
                {cinema
                  ? `${cinema.name}, ${cinema.city}, ${cinema.state}`
                  : "Unknown Cinema"}
              </div>

              {/* Time slots */}
              <div className="flex flex-wrap gap-2 w-full md:w-3/4">
                {timeSlots.map((slot) => {
                  const timestamp = new Date(slot).getTime();
                  
                  return (
                    <button
                      onClick={() => navigateToSlot(cinemaId, timestamp)}
                      key={timestamp}
                      className="flex items-center justify-center border px-5 py-3 text-xs rounded-md 
                               text-green-400 cursor-pointer hover:bg-green-900/20 transition-colors"
                      aria-label={`Select ${formatTime(new Date(slot))} show at ${cinema?.name || 'this cinema'}`}
                    >
                      {formatTime(new Date(slot))}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-4 text-center text-white/70">No cinema slots available for this date</div>
      )}
    </div>
  );
}