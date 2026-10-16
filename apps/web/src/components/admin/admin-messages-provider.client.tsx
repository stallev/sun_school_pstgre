"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminMessages } from "@/lib/messages/admin-messages";

const AdminMessagesContext = createContext<AdminMessages | null>(null);

type AdminMessagesProviderProps = {
  messages: AdminMessages;
  children: ReactNode;
};

export const AdminMessagesProvider = ({ messages, children }: AdminMessagesProviderProps) => (
  <AdminMessagesContext.Provider value={messages}>{children}</AdminMessagesContext.Provider>
);

export const useAdminMessages = (): AdminMessages => {
  const value = useContext(AdminMessagesContext);
  if (!value) throw new Error("useAdminMessages must be used within AdminMessagesProvider");
  return value;
};
