"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import InputBox from "@/components/InputBox";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassowrd] = useState("");

  return (
    <div className="text-white w-screen h-screen flex justify-center items-center">
      <div className="w-full md:w-1/3 bg-white/10 flex flex-col items-center py-3 rounded-lg px-10">
        <div className="text-3xl font-bold mb-2">Sign In</div>
        <div className="text-xs text-white/50 mb-3">
          Don't have an accout?{" "}
          <a className="underline hover:text-white" href="/signup">
            Create account.
          </a>
        </div>
        <InputBox
          type={"email"}
          placeholder="john@abc.com"
          label="Email"
          setValue={setEmail}
        />
        <InputBox
          type="password"
          placeholder="password"
          label="Password"
          setValue={setPassowrd}
        />
        <button onClick={async()=>{
            console.log(email, password);
            await signIn("credentials", {
                email: email,
                password: password,
                redirect: false,
              });
            router.push("/");

        }} className="mt-3 py-1 w-full bg-black rounded-md hover:border hover:border-blue-500 mb-6">Sign In</button>
      </div>
    </div>
  );
}
