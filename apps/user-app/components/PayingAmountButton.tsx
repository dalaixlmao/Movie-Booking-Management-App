export default function PayingAmountButton({ amount }: { amount: number }) {
  return <button className="text-white bg-red-500 w-fit px-12 py-2 rounded-lg cursor-pointer hover:bg-red-400 ">Pay Rs.{amount}</button>;
}
