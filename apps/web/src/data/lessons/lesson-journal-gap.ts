/** R-24: lesson appears in analytics “missing mark” journal filter. */
export const lessonHasJournalGap = (
  enrolledPupilIds: readonly string[],
  checkPupilIds: readonly string[],
  checkedHomeworkCount: number,
): boolean => {
  if (checkedHomeworkCount === 0 || enrolledPupilIds.length === 0) return false;
  const checkSet = new Set(checkPupilIds);
  return enrolledPupilIds.some((pupilId) => !checkSet.has(pupilId));
};
