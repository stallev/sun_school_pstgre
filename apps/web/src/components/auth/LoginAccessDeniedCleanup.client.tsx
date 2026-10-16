"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

/** Ends a stale session when the user lands on `/login?error=AccessDenied` (CU5 handoff). */
export const LoginAccessDeniedCleanup = () => {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void signOut({ redirect: false });
  }, []);

  return null;
};
