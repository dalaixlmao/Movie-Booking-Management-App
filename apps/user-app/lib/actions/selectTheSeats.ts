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

// For quick lookup of seats by their row and column coordinates
type SeatMap = Map<string, SeatType>;

/**
 * Selects seats in the auditorium based on user selection and requested number of seats
 * 
 * This function implements an optimized seat selection algorithm that:
 * 1. Starts from the selected seat
 * 2. Tries to find adjacent seats in the same row first (preferred seating pattern)
 * 3. Only wraps to nearby rows if necessary
 * 4. Skips already booked seats
 * 
 * Time complexity: O(rows * cols) in worst case but typically O(numberOfSeats)
 * Space complexity: O(rows * cols) for the seat map
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
  if (!audi || !selectedSeat || numberOfSeats <= 0) return [];
  
  const { rows, cols } = audi;
  const startRow = selectedSeat.row;
  const startCol = selectedSeat.col;
  
  // Create a seat map for O(1) lookups by row and column
  const seatMap: SeatMap = new Map();
  const availableSeats: SeatType[] = [];
  
  // Populate the seat map and track available seats
  for (const seat of audi.seats) {
    const key = `${seat.row}-${seat.col}`;
    seatMap.set(key, seat);
    
    if (!seat.booked) {
      availableSeats.push(seat);
    }
  }
  
  // If we don't have enough available seats total, return what we can
  if (availableSeats.length < numberOfSeats) {
    return availableSeats.slice(0, numberOfSeats).map(seat => seat.id);
  }
  
  // Try to get seats in the same row first (better user experience)
  const selectedSeats: SeatType[] = [];
  
  // Add the initially selected seat
  selectedSeats.push(selectedSeat);
  
  // Try to find adjacent seats in the same row (to the right)
  for (let i = 1; i < numberOfSeats; i++) {
    const nextCol = startCol + i;
    if (nextCol <= cols) {
      const key = `${startRow}-${nextCol}`;
      const seat = seatMap.get(key);
      
      if (seat && !seat.booked) {
        selectedSeats.push(seat);
      } else {
        break; // Gap found, try another approach
      }
    } else {
      break; // Reached end of row
    }
  }
  
  // If we couldn't get all seats in a row to the right, try to the left
  if (selectedSeats.length < numberOfSeats) {
    selectedSeats.length = 0; // Reset selection
    selectedSeats.push(selectedSeat);
    
    // Look to the left of the selected seat
    for (let i = 1; i < numberOfSeats; i++) {
      const nextCol = startCol - i;
      if (nextCol >= 1) {
        const key = `${startRow}-${nextCol}`;
        const seat = seatMap.get(key);
        
        if (seat && !seat.booked) {
          selectedSeats.push(seat);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }
  
  // If we still don't have enough seats, use the nearest available seats in adjacent rows
  if (selectedSeats.length < numberOfSeats) {
    // Start fresh with a proximity-based approach
    selectedSeats.length = 0;
    
    // Sort available seats by proximity to the selected seat
    availableSeats.sort((a, b) => {
      const distA = Math.abs(a.row - startRow) * cols + Math.abs(a.col - startCol);
      const distB = Math.abs(b.row - startRow) * cols + Math.abs(b.col - startCol);
      return distA - distB;
    });
    
    // Take the closest available seats
    return availableSeats.slice(0, numberOfSeats).map(seat => seat.id);
  }
  
  return selectedSeats.map(seat => seat.id);
}
