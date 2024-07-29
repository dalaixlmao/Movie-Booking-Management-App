import Seat from "@/components/Seat";

export default function selectTheSeats(
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
    | undefined,
  selectedSeat:
    | {
        id: number;
        row: number;
        col: number;
        audiId: number;
        booked: boolean;
        bookingId: number | null;
        price: number;
      }
    | undefined,
  numberOfSeats: number
) {
  if (!audi || !selectedSeat) return [];
  else {
    const seats = audi.seats;
    seats.sort(
      (
        a: {
          id: number;
          row: number;
          col: number;
          audiId: number;
          booked: boolean;
          bookingId: number | null;
          price: number;
        },
        b: {
          id: number;
          row: number;
          col: number;
          audiId: number;
          booked: boolean;
          bookingId: number | null;
          price: number;
        }
      ) => {
        return a.id - b.id;
      }
    );
    const rows = audi.rows;
    const cols = audi.cols;
    let c = selectedSeat.col;
    const bookedSeats = [];
    let noOfSeats = 0;
    let r = selectedSeat.row;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let nr = r + i;
        let nc = c + j;
        nr = ((nr - 1) % rows) + 1;
        nc = ((nc - 1) % cols) + 1;
        if (!seats[(nr - 1) * cols + nc - 1].booked) {
          bookedSeats.push(seats[(nr - 1) * cols + nc - 1].id);
          noOfSeats++;
        }
        if (noOfSeats == numberOfSeats) return bookedSeats;
        if (nc == cols) r++;
      }
    }
    return [];
  }
}
