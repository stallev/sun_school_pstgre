import { connection } from "next/server";

import { auth } from "@/auth";
import { PublicChrome } from "@/components/shell/PublicChrome";
import { RoleAppShellGate } from "@/components/shell/RoleAppShellGate.server";
import { USER_ROLE } from "@pulse/domain";

type HybridAppShellGateProps = {
  children: React.ReactNode;
};

export async function HybridAppShellGate({
  children,
}: Readonly<HybridAppShellGateProps>) {
  // Auth.js uses sync crypto — mark request-bound before auth() for Instant Navigations.
  await connection();
  const session = await auth();
  const role = session?.user?.role;

  if (role === USER_ROLE.CLIENT) {
    return (
      <RoleAppShellGate expectedRole={USER_ROLE.CLIENT}>
        {children}
      </RoleAppShellGate>
    );
  }

  if (role === USER_ROLE.TRAINER) {
    return (
      <RoleAppShellGate expectedRole={USER_ROLE.TRAINER}>
        {children}
      </RoleAppShellGate>
    );
  }

  if (role === USER_ROLE.ADMIN) {
    return (
      <RoleAppShellGate expectedRole={USER_ROLE.ADMIN}>
        {children}
      </RoleAppShellGate>
    );
  }

  return <PublicChrome>{children}</PublicChrome>;
}
