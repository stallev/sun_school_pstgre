type NameParts = {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
};

/** Display order: last, first, middle (Russian convention). */
export const formatDisplayName = (parts: NameParts): string => {
  const segments = [parts.lastName, parts.firstName, parts.middleName].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return segments.join(" ");
};
