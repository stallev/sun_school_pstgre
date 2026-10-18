/** Minimum distinct children before showing count (analytics spec §9.1, УД-7). */
export const ANALYTICS_DELETED_CHILDREN_DISCLOSURE_MIN = 3;

export function shouldShowDeletedDataNote(deletedChildCount: number): boolean {
  return deletedChildCount > 0;
}

export function shouldDiscloseDeletedChildCount(deletedChildCount: number): boolean {
  return deletedChildCount >= ANALYTICS_DELETED_CHILDREN_DISCLOSURE_MIN;
}
