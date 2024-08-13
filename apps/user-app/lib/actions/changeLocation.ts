'use server'
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
const prisma = new PrismaClient();
export default async function changeLocation(city:string) {
    const session = await getServerSession(authOptions);
    const id = Number(session.user.id);
    if(!id)
    {
        throw new Error("invalid auth");
    }
    try
    {const user = await prisma.user.update({
        where:{id},
        data:{city:city}
    });
    console.log("city changed", user);}
    catch(e:any){
        throw new Error(e.message);
    }
}
