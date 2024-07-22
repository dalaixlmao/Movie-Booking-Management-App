export default function totalSeatAmount(
  bookedSeats: number[],
  audi:
    | {
        id: number;
        rows: number;
        cols: number;
        name: string;
        seats: {
          id: number;
          row: number;
          col: number;
          audiId: number;
          booked: boolean;
          bookingId: number | null;
          price: number;
        }[];
      }
    | undefined
) {
    if(!audi)
        return 0;
    let amount =0;
    const seats = audi.seats;
    for(let i=0;i<seats.length;i++)
    {
        if(bookedSeats.includes(seats[i].id))
        amount+=seats[i].price;
    }
    return amount;
}
