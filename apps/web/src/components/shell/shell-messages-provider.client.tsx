"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShellMessages } from "@/lib/messages/shell-messages";

const ShellMessagesContext = createContext<ShellMessages | null>(null);

type ShellMessagesProviderProps = {
  messages: ShellMessages;
  children: ReactNode;
};

export const ShellMessagesProvider = ({ messages, children }: ShellMessagesProviderProps) => (
  <ShellMessagesContext.Provider value={messages}>{children}</ShellMessagesContext.Provider>
);

export const useShellMessages = (): ShellMessages => {
  const value = useContext(ShellMessagesContext);
  if (!value) {
    throw new Error("useShellMessages must be used within ShellMessagesProvider");
  }
  return value;
};
