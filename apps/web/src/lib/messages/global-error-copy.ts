/** Minimal copy for root `global-error.tsx` (outside providers). */
export const GLOBAL_ERROR_COPY = {
  ru: {
    title: "Что-то пошло не так",
    retry: "Повторить",
  },
  en: {
    title: "Something went wrong",
    retry: "Try again",
  },
} as const;

export type GlobalErrorCopy = {
  title: string;
  retry: string;
};

export const pickGlobalErrorCopy = (): GlobalErrorCopy => {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return GLOBAL_ERROR_COPY.en;
  }
  return GLOBAL_ERROR_COPY.ru;
};
