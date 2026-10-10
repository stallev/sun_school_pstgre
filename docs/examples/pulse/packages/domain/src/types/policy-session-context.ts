import type { UserRole } from "./user-role";

export type PolicySessionContext = {
  userId: string;
  role: UserRole | undefined;
};
