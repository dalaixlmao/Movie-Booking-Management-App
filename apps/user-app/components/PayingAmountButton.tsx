export default function PayingAmountButton({ amount, onClick }: { amount: number, onClick:()=>void }) {
  return <button onClick={onClick} className="text-white bg-red-500 w-fit px-12 py-2 rounded-lg cursor-pointer hover:bg-red-400 ">Pay Rs.{amount}</button>;
}
