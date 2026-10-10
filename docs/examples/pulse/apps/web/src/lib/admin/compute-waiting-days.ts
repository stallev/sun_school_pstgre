export function computeWaitingDays(submittedAt: string | Date | null): number {
  if (!submittedAt) {
    return 0;
  }

  const date =
    typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt;
  const diffMs = Date.now() - date.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
