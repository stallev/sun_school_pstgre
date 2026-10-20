export const fillMessage = (
  template: string,
  values: Record<string, string | number>,
): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
