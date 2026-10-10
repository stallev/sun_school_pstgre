import type { UserRole } from "@pulse/domain";

import { classifyPath } from "./classify-path";

/**
 * Single required role for perimeter gate, or `null` when path allows
 * multiple roles or any authenticated user (see `isRoleAllowedForPath`).
 */
export function getRequiredRoleForPath(pathname: string): UserRole | null {
  switch (classifyPath(pathname)) {
    case "client":
    case "book":
      return "client";
    case "trainer":
      return "trainer";
    case "admin":
      return "admin";
    case "session":
    case "upload":
    case "public":
      return null;
    default:
      return null;
  }
}
