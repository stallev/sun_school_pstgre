import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { verifyUserCredentials } from "@/data/auth/verify-user-credentials.server";

import authConfig from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const user = await verifyUserCredentials(credentials);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          locale: user.locale,
        };
      },
    }),
  ],
});
