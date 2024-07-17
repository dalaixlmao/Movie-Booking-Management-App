import CredentialsProvider  from "next-auth/providers/credentials";
import zod from 'zod';
import { PrismaClient } from "@repo/db";
const prisma = new PrismaClient();



export const authOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: {
            label: "Email",
            type: "text",
            placeholder: "jsmit@next.com",
          },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials: any) {
          try {
            const email = credentials.email;
            const password = credentials.password;
            const bodySchema = zod.object({
              email: zod.string().email(),
              password: zod.string().min(8),
            });
            const res = bodySchema.safeParse({
              email: email,
              password: password,
            });
            if (!res.success) return null;
            const user = await prisma.user.findUnique({
              where: { email: email },
            });
            if (!user) return null;
            console.log(user);
            return { id: user.id.toString() };
          } catch (e) {
            return null;
          }
  
          return null;
        },
      }),
    ],
    secret: process.env.NEXTAUTH_URL || "",
    callbacks: {
        async session({token, session}:any){
            session.user.id = token.sub;
            return session;
        }
    }
  };