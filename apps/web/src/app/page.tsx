import { redirect } from "next/navigation";
import { homeRouteFor } from "@sunschool/policy-edge";
import { auth } from "@/auth";

/** Home is a session redirect — Block per ADR-002. */
export const instant = false;

const HomePage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  redirect(homeRouteFor(session.user.status, session.user.roles));
};

export default HomePage;
