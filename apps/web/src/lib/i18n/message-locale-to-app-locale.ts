import { APP_LOCALE, type AppLocale } from "@sunschool/domain";
import type { MessageLocale } from "@/lib/messages/get-dictionary";

export const messageLocaleToAppLocale = (locale: MessageLocale): AppLocale =>
  locale === "en" ? APP_LOCALE.EN : APP_LOCALE.RU;
