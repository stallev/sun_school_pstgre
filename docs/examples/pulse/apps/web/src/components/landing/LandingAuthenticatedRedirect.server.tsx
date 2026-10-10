import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getRoleHome } from "@pulse/policy-edge";

import { auth } from "@/auth";

export async function LandingAuthenticatedRedirect() {
  await connection();
  const session = await auth();

  if (session?.user?.role) {
    redirect(getRoleHome(session.user.role));
  }

  return null;
}
