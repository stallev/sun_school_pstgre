export type PathSegment =
  | "public"
  | "client"
  | "trainer"
  | "admin"
  | "book"
  | "session"
  | "upload";

export function classifyPath(pathname: string): PathSegment {
  if (
    pathname === "/" ||
    pathname.startsWith("/trainers") ||
    pathname.startsWith("/auth")
  ) {
    return "public";
  }

  if (pathname.startsWith("/client")) {
    return "client";
  }

  if (pathname.startsWith("/trainer")) {
    return "trainer";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/book")) {
    return "book";
  }

  if (pathname.startsWith("/sessions")) {
    return "session";
  }

  if (pathname === "/api/upload") {
    return "upload";
  }

  return "public";
}

export function requiresAuth(pathname: string): boolean {
  const segment = classifyPath(pathname);
  return segment !== "public";
}
