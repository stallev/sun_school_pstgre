import "server-only";

import bcrypt from "bcryptjs";

import {
  loginCredentialsSchema,
  type UserRole,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/lib/i18n/constants";

export type VerifiedUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  locale: AppLocale;
};

export async function verifyUserCredentials(
  rawCredentials: unknown,
): Promise<VerifiedUser | null> {
  const parsed = loginCredentialsSchema.safeParse(rawCredentials);
  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const user = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    locale: isAppLocale(user.locale) ? user.locale : DEFAULT_LOCALE,
  };
}
