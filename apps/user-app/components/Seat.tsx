export default function Seat({
  seat, totalCols
}: {
  seat: {
    id: number;
    row: number;
    col: number;
    audiId: number;
    booked: boolean;
    bookingId: number | null;
    price: number;
  };
  totalCols:number
}) {

  return (
    <div className="h-6 text-xs flex justify-center items-center w-6 rounded-sm border border-green-400/70 hover:bg-green-400/70 hover:font-semibold hover:text-black text-green-400/70">
      {((seat.col-1)%totalCols)+1}
    </div>
  );
}
