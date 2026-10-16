"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthMessages } from "@/lib/messages/auth-messages";

const AuthMessagesContext = createContext<AuthMessages | null>(null);

type AuthMessagesProviderProps = {
  messages: AuthMessages;
  children: ReactNode;
};

export const AuthMessagesProvider = ({ messages, children }: AuthMessagesProviderProps) => (
  <AuthMessagesContext.Provider value={messages}>{children}</AuthMessagesContext.Provider>
);

export const useAuthMessages = (): AuthMessages => {
  const value = useContext(AuthMessagesContext);
  if (!value) throw new Error("useAuthMessages must be used within AuthMessagesProvider");
  return value;
};
