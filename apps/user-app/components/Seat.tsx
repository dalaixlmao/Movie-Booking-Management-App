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
  if(seat.booked)
  {
    return <div
    className={"bg-white/20 font-semibold text-black md:h-6 h-2 w-2  md:w-6 text-[9px] md:text-xs flex justify-center items-center rounded-sm border border-white/20 cursor-default"}
  >
    {seat.col}
  </div>
  }
  return (
    <div
      onClick={onClick}
      className={((isSelected)?"bg-red-400/70 font-semibold text-black ":"hover:bg-red-400 hover:font-semibold hover:text-black text-red-400/70 ")+"md:h-6 h-2 w-2  md:w-6 text-[9px] md:text-xs flex justify-center items-center rounded-sm border border-red-400/70 cursor-pointer"}
    >
      {seat.col}
    </div>
  );
}
