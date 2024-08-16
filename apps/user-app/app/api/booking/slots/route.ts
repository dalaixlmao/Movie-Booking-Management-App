import { NextResponse } from "next/server";
import { PrismaClient } from "@repo/db/client";
const prisma = new PrismaClient();
export async function POST(req: Request) {
  const body = await req.json();
  const cinemaId = body.cinemaId;
  const timeStamp = body.timeStamp;
  const dateTime = new Date(timeStamp);
  const audi = await prisma.audi.findMany({
    where:{
        cinemaId:cinemaId,
        slots:{
            some:{
                slots:{
                    has:dateTime
                }
            }
        }
    },
    select:{
        id:true,
        name:true,
        seats:true,
        rows:true,
        cols:true,
    }
  });

  return NextResponse.json({audi:audi[0]});
}
