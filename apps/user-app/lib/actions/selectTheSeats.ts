import Seat from "@/components/Seat";

/**
 * Seat Type Definition
 */
type SeatType = {
  id: number;
  row: number;
  col: number;
  audiId: number;
  booked: boolean;
  bookingId: number | null;
  price: number;
};

/**
 * Auditorium Type Definition
 */
type AudiType = {
  id: number;
  rows: number;
  cols: number;
  name: string;
  seats: SeatType[];
};

/**
 * Selects seats in the auditorium based on user selection and requested number of seats
 * 
 * This function implements a seat selection algorithm that:  
 * 1. Starts from the selected seat
 * 2. Adds adjacent seats until the requested number is reached
 * 3. Skips already booked seats
 * 4. Wraps to the next row if needed
 * 
 * @param audi - Auditorium data with seats configuration
 * @param selectedSeat - The initial seat selected by the user
 * @param numberOfSeats - How many seats to select
 * @returns Array of seat IDs that should be selected
 */
export default function selectTheSeats(
  audi: AudiType | undefined,
  selectedSeat: SeatType | undefined,
  numberOfSeats: number
): number[] {
  // Return empty array if we don't have auditorium data or a selected seat
  if (!audi || !selectedSeat) return [];
  else {
    // Get seats array and sort by ID for consistent ordering
    const seats = [...audi.seats];
    seats.sort((a: SeatType, b: SeatType) => a.id - b.id);
    const rows = audi.rows;
    const cols = audi.cols;
    let c = selectedSeat.col; // Starting column
    const bookedSeats: number[] = []; // Array to hold selected seat IDs
    let noOfSeats = 0; // Counter for number of seats selected
    let r = selectedSeat.row; // Starting row
    
    // Iterate through rows and columns starting from the selected seat
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Calculate next row and column with wrap-around
        let nr = r + i;
        let nc = c + j;
        nr = ((nr - 1) % rows) + 1; // Ensure row wraps around (1 to rows)
        nc = ((nc - 1) % cols) + 1; // Ensure column wraps around (1 to cols)
        
        // Calculate seat index in the flat array
        const seatIndex = (nr - 1) * cols + nc - 1;
        
        // Add seat if it's not already booked
        if (seatIndex < seats.length && !seats[seatIndex].booked) {
          bookedSeats.push(seats[seatIndex].id);
          noOfSeats++;
          
          // Return as soon as we have enough seats
          if (noOfSeats === numberOfSeats) return bookedSeats;
        }
        
        // Move to next row when we reach the end of a column
        if (nc === cols) r++;
      }
    }
    
    // If we couldn't find enough available seats
    return bookedSeats; // Return whatever seats we found
  }
}
