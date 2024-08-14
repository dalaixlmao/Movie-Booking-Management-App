import CredentialsProvider from "next-auth/providers/credentials";
import zod from "zod";
import { PrismaClient } from "@repo/db/client";
import { pages } from "next/dist/build/templates/app-page";
import { hash, compare } from "bcrypt";
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
        if (credentials.name) {
          try {
            const { email, password, name, phone } = credentials;
            const bodySchema = zod.object({
              email: zod.string().email(),
              password: zod.string(),
              name: zod.string(),
              phone: zod.string(),
            });
            const res = bodySchema.safeParse({
              email,
              password,
              name,
              phone,
            });

            if (!res.success) return null;
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) null;
            else {
              const hashedPass = await hash(password, 10);
              const user = await prisma.user.create({
                data: {
                  name,
                  email,
                  phone,
                  password: hashedPass,
                  city: "",
                  zip: "",
                  state: "",
                  balance: Math.random() * 1000000,
                },
              });
              return { id: user.id.toString() };
            }
          } catch {
            return null;
          }
        } else {
          try {
            const email = credentials.email;
            const password = credentials.password;
            const hashedPass = await hash(password, 10);
            const bodySchema = zod.object({
              email: zod.string().email(),
              password: zod.string().min(8),
            });
            const res = bodySchema.safeParse({
              email: email,
              password: password,
            });
            console.log("1 passed", res, email, password);
            if (!res.success) return null;
            const user = await prisma.user.findUnique({
              where: { email: email },
            });
            console.log("2passed", res.success);
            if (!user) return null;
            const res1 = await compare(password, user.password);
            console.log("3passed", res1, user.password, hashedPass);
            if (!res1) return null;
            console.log("4passed", res1);
            return { id: user.id.toString() };
          } catch (e) {
            return null;
          }
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_URL || "",
  callbacks: {
    async session({ token, session }: any) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
  },
};
