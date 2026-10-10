import { RoleAppShellGate } from "@/components/shell/RoleAppShellGate.server";
import { USER_ROLE } from "@pulse/domain";

export async function ClientAppShellGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleAppShellGate expectedRole={USER_ROLE.CLIENT}>
      {children}
    </RoleAppShellGate>
  );
}
