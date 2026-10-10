import { RoleAppShellGate } from "@/components/shell/RoleAppShellGate.server";
import { USER_ROLE } from "@pulse/domain";

export async function TrainerAppShellGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleAppShellGate expectedRole={USER_ROLE.TRAINER}>
      {children}
    </RoleAppShellGate>
  );
}
