import { NextResponse } from "next/server";
import { PrismaClient } from ".prisma/client";
const prisma = new PrismaClient();
export default async function GET(req : Request){
    const body = await req.json();
    const id = body.id;
    const movie = await prisma.movie.findUnique({
        where:{id:id}
    })
    return NextResponse.json({
        movie:movie,
        message:'Fetched Movie!'
    })
}