"use client";

import { createContext, useContext, useMemo, useState } from "react";

import type { DemoRole } from "@/lib/demo/demo-credentials";

type DemoCredentials = {
  email: string;
  password: string;
};

type LoginCredentialsContextValue = {
  demoRole: DemoRole | null;
  setDemoRole: (role: DemoRole | null) => void;
  credentials: DemoCredentials | null;
  setCredentials: (credentials: DemoCredentials | null) => void;
};

const LoginCredentialsContext = createContext<LoginCredentialsContextValue | null>(
  null,
);

export function LoginCredentialsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null);

  const value = useMemo(
    () => ({
      demoRole,
      setDemoRole,
      credentials,
      setCredentials,
    }),
    [credentials, demoRole],
  );

  return (
    <LoginCredentialsContext.Provider value={value}>
      {children}
    </LoginCredentialsContext.Provider>
  );
}

export function useLoginCredentials() {
  const context = useContext(LoginCredentialsContext);
  if (!context) {
    throw new Error("useLoginCredentials must be used within LoginCredentialsProvider");
  }
  return context;
}
