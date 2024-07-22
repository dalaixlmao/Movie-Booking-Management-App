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
  if(isSelected)
    {console.log(seat, (seat.row - 1) * 20 + seat.col - 1);}
  return (
    <div
      onClick={onClick}
      className={((isSelected)?"bg-red-400/70 font-semibold text-black ":"hover:bg-red-400 hover:font-semibold hover:text-black text-red-400/70 ")+"h-6 text-xs flex justify-center items-center w-6 rounded-sm border border-red-400/70 cursor-pointer"}
    >
      {seat.col}
    </div>
  );
}
