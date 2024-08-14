"use client"
import getUserName from "@/lib/actions/getUserName";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";


export default function NameComponent() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(()=>{
        async function a(){
            const a = await getUserName();
            if(a)
            setName(a);
        }
        a();
    },[name])



  return <div onClick={()=>{setOpen(!open)}} className="flex flex-row items-center">
    <div className="h-6 w-6 rounded-full bg-gray-300"></div>
    <div className="flex flex-col">
    <div  className="ml-2">{name}</div>
    {open?<div onClick={async ()=>{ await signOut(); router.push("/signin"); }} className="text-sm cursor-pointer hover:bg-white/60 hover:font-sembold bg-white/30 backdrop-blur-md rounded-md absolute p-4 top-[70px] right-[25px]">Sign out</div>:<></>}
    </div>
  </div>;
}
