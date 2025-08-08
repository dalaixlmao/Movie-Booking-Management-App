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
 * Calculates the total price for selected seats
 * 
 * This function uses a Map for O(1) lookups of seat information instead of
 * iterating through all seats for each booked seat (reducing time complexity from O(n²) to O(n))
 * 
 * @param bookedSeats - Array of seat IDs that are selected for booking
 * @param audi - Auditorium data containing seat information
 * @returns Total price of the selected seats in the auditorium's currency unit
 */
export default function totalSeatAmount(
  bookedSeats: number[],
  audi: AudiType | undefined
): number {
  // Early return if auditorium data is missing or no seats are booked
  if (!audi || bookedSeats.length === 0) return 0;
  
  // Create a map for O(1) lookups of seat prices by ID
  const seatPriceMap = new Map<number, number>();
  
  // Populate the map with seat IDs and their prices
  for (const seat of audi.seats) {
    seatPriceMap.set(seat.id, seat.price);
  }
  
  // Sum up the prices for all booked seats
  return bookedSeats.reduce((total, seatId) => {
    const price = seatPriceMap.get(seatId) || 0;
    return total + price;
  }, 0);
}
