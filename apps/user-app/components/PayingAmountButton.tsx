import CircularLoader from "./CircularLoader";
export default function PayingAmountButton({
  amount,
  onClick,
  loader,
}: {
  amount: number;
  onClick: () => void;
  loader: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="text-white bg-red-500 h-10 w-fit px-12 rounded-lg cursor-pointer hover:bg-red-400 "
    >
      {!loader ? "Pay Rs. " + amount  : <CircularLoader size="3" />}
    </button>
  );
}
