'use server'
import { PrismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
const prisma = new PrismaClient();
export default async function getUserName() {
    const session = await getServerSession(authOptions);
    const id = Number(session.user.id);
    const user = await prisma.user.findUnique({
        where:{
            id:id
        },
        select:{
            name:true,
        }
    });
    return user?.name;
}
