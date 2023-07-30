import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prismadb";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth/next";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID1 || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET1 || "",
    }),
  ],
};

export default NextAuth({
  ...authOptions,
});
