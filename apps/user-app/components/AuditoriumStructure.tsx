"use client";

/**
 * AuditoriumStructure Component
 * 
 * Renders the auditorium seat matrix and handles seat selection logic.
 * This component allows users to select seats in a movie auditorium
 * and proceed to the payment process.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.userId - The ID of the current user making the booking
 */

import Seat from "./Seat";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "./Popup";
import selectTheSeats from "@/lib/actions/selectTheSeats";
import PayingAmountButton from "./PayingAmountButton";
import totalSeatAmount from "@/lib/actions/totalSeatAmount";
import getSeat from "@/lib/actions/getSeat";
import CircularLoader from "./CircularLoader";

/** Alphabet letters used for row labels */
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Type definitions
type SeatType = {
  id: number;
  row: number;
  col: number;
  audiId: number;
  booked: boolean;
  bookingId: number | null;
  price: number;
};

type AudiType = {
  id: number;
  rows: number;
  cols: number;
  name: string;
  seats: SeatType[];
};

export default function AuditoriumStructure({ userId }: { userId: number }) {
  // Get cinema and timestamp from URL parameters - memoized to prevent recalculation
  const searchParam = useSearchParams();
  const movieId = useMemo(() => Number(searchParam.get("cinemaId")), [searchParam]);
  const timeStamp = useMemo(() => Number(searchParam.get("timeStamp")), [searchParam]);
  
  // State for managing auditorium display and seat selection
  const [loader, setLoader] = useState(true);
  const [bookSeats, setBookSeats] = useState<SeatType[]>();
  const [popupVisible, setPopupVisible] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<SeatType>();
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [buttonClicked, setButtonClicked] = useState(0);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [audi, setAudi] = useState<AudiType>();

  /**
   * Fetches auditorium and seat data
   * Memoized to prevent unnecessary refetches
   */
  const fetchAuditoriumData = useCallback(async () => {
    try {
      // Fetch auditorium data based on cinema and time selection
      const res = await axios.post("/api/booking/slots", {
        movieId,
        timeStamp,
      });
      
      // Update auditorium data
      const audiData = res.data.audi;
      setAudi(audiData);
      
      // Fetch seat data for this auditorium
      const audiId = audiData.id;
      const seatData = await getSeat(audiId);
      setBookSeats(seatData);
      
      // Remove loading state
      setLoader(false);
    } catch (error) {
      console.error("Error fetching auditorium data:", error);
    }
  }, [movieId, timeStamp]);

  /**
   * Effect to fetch auditorium and seat data when component mounts
   * or when timeStamp/movieId changes
   */
  useEffect(() => {
    fetchAuditoriumData();
  }, [fetchAuditoriumData]);

  /**
   * Handles seat selection when user clicks on a seat
   * Memoized to prevent unnecessary function recreations
   */
  const handleSeatSelection = useCallback((seat: SeatType) => {
    if (!seat.booked) {
      setSelectedSeat(seat);
    }
  }, []);

  /**
   * Send booking request to Express server
   * Memoized to prevent unnecessary function recreations
   */
  const sendBookingRequest = useCallback(async () => {
    if (buttonClicked === 0 || bookedSeats.length === 0) return;
    
    setButtonLoader(true);
    try {
      const response = await axios.post(
        process.env.EXPRESS_SERVER_URL || "http://localhost:8080", 
        {
          bookedSeats,
          userId,
          startTime: timeStamp,
          cinemaId: movieId,
        }
      );
      
      console.log("Booking request added to queue:", response.data);
    } catch (error) {
      console.error("Error sending booking request:", error);
    } finally {
      setButtonLoader(false);
    }
  }, [buttonClicked, bookedSeats, userId, timeStamp, movieId]);

  /**
   * Effect to update selected seats whenever the user selects a new seat
   * or changes the number of seats
   */
  useEffect(() => {
    const selectedSeats = selectTheSeats(audi, selectedSeat, numberOfSeats);
    setBookedSeats(selectedSeats);
  }, [selectedSeat, audi, numberOfSeats]);

  /**
   * Effect for handling payment button clicks
   */
  useEffect(() => {
    sendBookingRequest();
  }, [sendBookingRequest]);

  // Show loading spinner while fetching auditorium data
  if (loader || !audi || !bookSeats) {
    return (
      <div className="w-full text-white h-full mt-36 flex justify-center items-center" data-testid="circular-loader">
        <CircularLoader size="10" />
      </div>
    );
  }

  // Calculate seat width once for all seats
  const seatWidth = 100 / audi.cols;

  // Pre-calculate row letters for performance
  const rowLetters: Record<number, string> = {};
  for (let i = 0; i < audi.rows; i++) {
    rowLetters[i] = ROW_LETTERS[i] || '#';
  }

  return (
    <div className="flex justify-center flex-col items-center w-full">
      {/* Seat selection popup - shows at the beginning to select number of seats */}
      {popupVisible && (
        <Popup
          setPopupVisible={setPopupVisible}
          setSeats={setNumberOfSeats}
          selectedSeats={numberOfSeats}
          setSelectedSeats={setNumberOfSeats}
          data-testid="seat-selection-popup"
        />
      )}

      {/* Screen display at the top of the seat layout */}
      <div className="mt-7 text-xs font-light text-center">
        <div className="mb-2">All eyes here please!</div>
        <Screen data-testid="screen" />
      </div>

      {/* Seat grid/matrix - using CSS Grid for better layout performance */}
      <div 
        className="mt-7 grid gap-2"
        style={{ 
          gridTemplateColumns: `repeat(${audi.cols}, 1fr)`,
          width: '100%',
          maxWidth: '800px'
        }}
      >
        {bookSeats.map((seat, index) => {
          const rowIndex = Math.floor(index / audi.cols);
          const colIndex = index % audi.cols;
          const isSelected = bookedSeats.includes(seat.id);
          
          return (
            <div
              key={seat.id}
              className="flex items-center justify-center relative"
            >
              {/* Row labels at the beginning of each row */}
              {colIndex === 0 && (
                <div className="absolute left-[-15px] text-[8px] md:text-sm text-white/30">
                  {rowLetters[rowIndex]}
                </div>
              )}
              
              {/* Seat component */}
              <div
                onClick={() => handleSeatSelection(seat)}
                data-testid={`seat-container-${seat.id}`}
              >
                <Seat
                  onClick={() => {}} // Empty handler as click is managed by parent
                  seat={seat}
                  totalCols={audi.cols}
                  isSelected={isSelected}
                  data-testid={`seat-${seat.id}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment button footer - only shown after a seat is selected */}
      {selectedSeat && bookedSeats.length > 0 && (
        <div className="fixed w-full bottom-0 flex flex-col items-center bg-white/10 py-4 z-10">
          <PayingAmountButton
            loader={buttonLoader}
            amount={totalSeatAmount(bookedSeats, audi) / 100}
            onClick={() => setButtonClicked(prev => prev + 1)}
            data-testid="pay-button"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Screen Component
 * Renders the movie screen at the top of the auditorium
 * Memoized to prevent unnecessary re-renders
 */
const Screen = React.memo(() => {
  return (
    <svg
      width="200"
      height="10"
      viewBox="0 0 521 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="screen"
    >
      <path d="M521 46L413 0H108L0 46H521Z" fill="white" opacity="0.2" />
    </svg>
  );
});
