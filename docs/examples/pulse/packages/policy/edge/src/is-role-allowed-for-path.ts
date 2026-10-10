import type { UserRole } from "@pulse/domain";

import { classifyPath } from "./classify-path";

export function isRoleAllowedForPath(
  role: UserRole,
  pathname: string,
): boolean {
  switch (classifyPath(pathname)) {
    case "public":
      return true;
    case "client":
    case "book":
      return role === "client";
    case "trainer":
      return role === "trainer";
    case "admin":
      return role === "admin";
    case "session":
      return role === "client" || role === "admin";
    case "upload":
      return role === "client" || role === "trainer" || role === "admin";
    default:
      return false;
  }
}
