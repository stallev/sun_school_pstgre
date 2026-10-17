/** Strips HTML tags from lesson body before persistence (plain-text MVP editor). */
export const sanitizeLessonBody = (raw: string): string | undefined => {
  const stripped = raw.replace(/<[^>]*>/g, "").trim();
  if (!stripped) return undefined;
  return stripped.slice(0, 50_000);
};
