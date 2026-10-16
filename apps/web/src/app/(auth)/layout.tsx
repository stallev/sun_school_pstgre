import type { ReactNode } from "react";
import { AuthMessagesProvider } from "@/components/auth/auth-messages-provider.client";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { getDictionary } from "@/lib/messages/get-dictionary";

export const instant = false;

type AuthGroupLayoutProps = {
  children: ReactNode;
};

/** Centered auth screens without app chrome (global_shell_spec §4). */
const AuthGroupLayout = async ({ children }: AuthGroupLayoutProps) => {
  const locale = await getUiLocale();
  const authDictionary = await getDictionary(locale, "auth");
  const authMessages = pickAuthMessages(authDictionary);

  return <AuthMessagesProvider messages={authMessages}>{children}</AuthMessagesProvider>;
};

export default AuthGroupLayout;
