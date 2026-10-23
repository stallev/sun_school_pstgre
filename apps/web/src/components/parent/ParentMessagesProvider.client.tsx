"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ParentMessages } from "@/lib/messages/parent-messages";

const ParentMessagesContext = createContext<ParentMessages | null>(null);

type ParentMessagesProviderProps = {
  messages: ParentMessages;
  children: ReactNode;
};

export const ParentMessagesProvider = ({ messages, children }: ParentMessagesProviderProps) => (
  <ParentMessagesContext.Provider value={messages}>{children}</ParentMessagesContext.Provider>
);

export const useParentMessages = (): ParentMessages => {
  const messages = useContext(ParentMessagesContext);
  if (!messages) {
    throw new Error("useParentMessages must be used within ParentMessagesProvider");
  }
  return messages;
};
