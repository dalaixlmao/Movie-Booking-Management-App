const month = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function DateScroll({ dates }: { dates: Date[] }) {
  return (
    <div className="flex flex-row items-center">
        <Left />
        <div className="w-1/4 flex flex-row">{dates.map((date) => {
          return (
            <div className="mr-5 flex flex-col items-center">
              <div className="text-xs text-white/50">{day[date.getDay()]}</div>
              <div>{date.getDate()}</div>
              <div className="text-xs text-white/50">{month[date.getMonth()]}</div>
            </div>
          );
        })}</div>
        <Right/>
    </div>
  );
}


function Left(){
    return<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
</svg>

}


function Right(){
    return<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>

}