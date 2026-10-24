"use client";

import type { UserRole } from "@sunschool/domain";
import type { ComponentType } from "react";

export type DevRoleMenuGroupProps = {
  shellRole: UserRole;
  previewRole: UserRole;
  onPreviewRoleChange: (role: UserRole) => void;
};

export type DevRoleMenuGroup = ComponentType<DevRoleMenuGroupProps>;

export async function loadDevRoleMenuGroup(): Promise<DevRoleMenuGroup> {
  const mod = await import("@/components/shell/dev-role-switcher");
  return mod.DevRoleMenuGroup;
}
