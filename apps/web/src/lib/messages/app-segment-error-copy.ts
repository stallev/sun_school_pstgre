/** Minimal copy for `(app)/error.tsx` (outside message providers). */
export const APP_SEGMENT_ERROR_COPY = {
  ru: {
    title: "Не удалось открыть страницу",
    retry: "Повторить",
    home: "На главную",
    digestLabel: "Код для поддержки",
  },
  en: {
    title: "Could not open this page",
    retry: "Try again",
    home: "Go to home",
    digestLabel: "Support code",
  },
} as const;

export type AppSegmentErrorCopy = (typeof APP_SEGMENT_ERROR_COPY)[keyof typeof APP_SEGMENT_ERROR_COPY];

export const pickAppSegmentErrorCopy = (): AppSegmentErrorCopy => {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return APP_SEGMENT_ERROR_COPY.en;
  }
  return APP_SEGMENT_ERROR_COPY.ru;
};
