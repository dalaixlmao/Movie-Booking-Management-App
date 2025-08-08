/**
 * Seat Component
 * 
 * Renders an individual seat in the auditorium with appropriate styling based on its status
 * (available, booked, or selected).
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when seat is clicked
 * @param {Object} props.seat - Seat data object containing seat details
 * @param {number} props.seat.id - Unique identifier for the seat
 * @param {number} props.seat.row - Row number of the seat
 * @param {number} props.seat.col - Column number of the seat
 * @param {number} props.seat.audiId - ID of the auditorium this seat belongs to
 * @param {boolean} props.seat.booked - Whether the seat is already booked
 * @param {number|null} props.seat.bookingId - ID of the booking if seat is booked
 * @param {number} props.seat.price - Price of the seat in smallest currency unit
 * @param {number} props.totalCols - Total number of columns in the auditorium
 * @param {boolean} props.isSelected - Whether the seat is currently selected
 * @returns {JSX.Element} - Rendered seat component
 */
export default function Seat({
  onClick,
  seat,
  totalCols,
  isSelected,
}: {
  onClick: () => void;
  seat: {
    id: number;
    row: number;
    col: number;
    audiId: number;
    booked: boolean;
    bookingId: number | null;
    price: number;
  };
  totalCols: number;
  isSelected: boolean;
}) {
  // Log details about selected seats for debugging purposes
  if(isSelected) {
    console.log(`Selected seat: Row ${seat.row}, Col ${seat.col}, ID ${seat.id}`);
  }
  // Render already booked seats with a distinct appearance
  if(seat.booked) {
    return <div
      className={"bg-white/20 font-semibold text-black md:h-6 h-2 w-2 md:w-6 text-[9px] md:text-xs flex justify-center items-center rounded-sm border border-white/20 cursor-default"}
      data-testid={`seat-${seat.id}`}
      aria-label={`Seat ${seat.row}${String.fromCharCode(64 + seat.col)} (booked)`}
      aria-disabled="true"
    >
      {seat.col}
    </div>
  }
  // Render available seats that can be selected
  return (
    <div
      onClick={onClick}
      className={(
        // Dynamic class based on selection state
        (isSelected) 
          ? "bg-red-400/70 font-semibold text-black " 
          : "hover:bg-red-400 hover:font-semibold hover:text-black text-red-400/70 "
        ) + 
        "md:h-6 h-2 w-2 md:w-6 text-[9px] md:text-xs flex justify-center items-center rounded-sm border border-red-400/70 cursor-pointer"
      }
      data-testid={`seat-${seat.id}`}
      aria-label={`Seat ${seat.row}${String.fromCharCode(64 + seat.col)}${isSelected ? ' (selected)' : ''}`}
      role="button"
    >
      {seat.col}
    </div>
  );
}
