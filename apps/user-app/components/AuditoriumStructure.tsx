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
import { useEffect } from "react";
import { useState } from "react";
import Popup from "./Popup";
import selectTheSeats from "@/lib/actions/selectTheSeats";
import PayingAmountButton from "./PayingAmountButton";
import totalSeatAmount from "@/lib/actions/totalSeatAmount";
import getSeat from "@/lib/actions/getSeat";
import CircularLoader from "./CircularLoader";

/** Alphabet letters used for row labels */
const lettr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function AuditoriumStructure({ userId }: { userId: number }) {
  // Get cinema and timestamp from URL parameters
  const searchParam = useSearchParams();
  const movieId = Number(searchParam.get("cinemaId"));
  const timeStamp = Number(searchParam.get("timeStamp"));
  
  // State for managing auditorium display and seat selection
  const [tCols, setTCols] = useState<number>(0);
  const [seats, setSeats] = useState(0);
  const [loader, setLoader] = useState(true);
  
  // Type definition for seat object
  type SeatType = {
    id: number;
    row: number;
    col: number;
    audiId: number;
    booked: boolean;
    bookingId: number | null;
    price: number;
  };
  
  // State for storing all seats in the auditorium
  const [bookSeats, setBookSeats] = useState<SeatType[]>();
  // UI state management
  const [popupVisible, setPopupVisible] = useState(true); // Controls the seat quantity selection popup
  const [selectedSeat, setSelectedSeat] = useState<SeatType>(); // The first seat selected by the user
  const [numberOfSeats, setNumberOfSeats] = useState(1); // Number of seats to book
  const [bookedSeats, setBookedSeats] = useState([-1]); // Array of seat IDs to be booked
  const [buttonClicked, setButtonClicked] = useState(0); // Counter for payment button clicks
  const [buttonLoader, setButtonLoader] = useState(false); // Loading state for payment button
  
  // Auditorium data state
  type AudiType = {
    id: number;
    rows: number;
    cols: number;
    name: string;
    seats: SeatType[];
  };
  
  const [audi, setAudi] = useState<AudiType>();

  /**
   * Effect for handling payment button clicks
   * When the button is clicked, send booking request to Express server
   */
  useEffect(() => {
    if (buttonClicked != 0) {
      setButtonLoader(true);
      
      // Function to send booking request to Express server
      async function sendBookingRequest() {
        try {
          const response = await axios.post(process.env.EXPRESS_SERVER_URL || "http://localhost:8080", {
            bookedSeats: bookedSeats,
            userId: userId,
            startTime: timeStamp,
            cinemaId: movieId,
          });
          
          // Request added to queue successfully
          console.log("Booking request added to queue:", response.data);
        } catch (error) {
          console.error("Error sending booking request:", error);
        } finally {
          setButtonLoader(false);
        }
      }

      sendBookingRequest();
    }
  }, [buttonClicked, bookedSeats, userId, timeStamp, movieId]);

  /**
   * Effect to fetch auditorium and seat data when component mounts
   * or when timeStamp/movieId changes
   */
  useEffect(() => {
    async function getAudi() {
      try {
        // Fetch auditorium data based on cinema and time selection
        const res = await axios.post("/api/booking/slots", {
          movieId: movieId,
          timeStamp: timeStamp,
        });
        
        // Update auditorium data
        setAudi(res.data.audi);
        setTCols((audi ? audi.cols : 0) + 1);
        
        // Fetch seat data for this auditorium
        const audiId = res.data.audi.id;
        const seatData = await getSeat(audiId);
        setBookSeats(seatData);
        
        // Remove loading state
        setLoader(false);
      } catch (error) {
        console.error("Error fetching auditorium data:", error);
      }
    }
    
    getAudi();
  }, [timeStamp, movieId, audi]);

  /**
   * Effect to update selected seats whenever the user selects a new seat
   * or changes the number of seats
   */
  useEffect(() => {
    // Use selectTheSeats utility to determine which seats should be selected
    // based on the starting seat and number of seats requested
    const bookedSeats = selectTheSeats(audi, selectedSeat, numberOfSeats);
    setBookedSeats(bookedSeats);
  }, [selectedSeat, audi, numberOfSeats]);

  /**
   * Placeholder function for seat click handler
   * Actual seat selection is handled by onClick in the JSX below
   */
  function onSeatClick() {}
  // Show loading spinner while fetching auditorium data
  if (loader || !audi) {
    return (
      <div className="w-full text-white h-full mt-36 flex justify-center items-center" data-testid="circular-loader">
        <CircularLoader size="10" />
      </div>
    );
  }

  const seatWidth = 100 / audi.cols;


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

      {/* Seat grid/matrix */}
      <div className="mt-7 flex flex-wrap">
        {bookSeats?.map((elem, index) => (
          <div
            key={index}
            className="flex flex-row justify-center w-fit h-fit items-center my-2"
            style={{ width: `${seatWidth.toString()}%` }}
          >
            {/* Row labels (A, B, C, etc.) at the beginning of each row */}
            {index % audi.cols === 0 && (
              <div className="w-3 text-[8px] md:text-sm text-white/30">
                {lettr[Math.floor(index / audi.cols)]}
              </div>
            )}
            
            {/* Seat component with click handler */}
            <div
              className={index % audi.cols === 1 ? "ml-1" : ""}
              onClick={() => {
                // Only allow selecting seats that aren't already booked
                if (!elem.booked) setSelectedSeat(elem);
              }}
              data-testid={`seat-container-${elem.id}`}
            >
              <Seat
                onClick={onSeatClick}
                seat={elem}
                totalCols={audi.cols}
                isSelected={bookedSeats.includes(elem.id)}
                data-testid={`seat-${elem.id}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Payment button footer - only shown after a seat is selected */}
      {selectedSeat && (
        <div className="absolute w-full bottom-0 flex flex-col items-center bg-white/10 py-4">
          <PayingAmountButton
            loader={buttonLoader}
            amount={totalSeatAmount(bookedSeats, audi) / 100} // Convert from cents to currency unit
            onClick={() => {
              setButtonClicked((prev) => prev + 1); // Increment to trigger payment effect
            }}
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
 * @returns {JSX.Element} SVG representation of the screen
 */
function Screen() {
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
}
