import type { Messages } from "@/lib/messages/types";

export const REVIEW_TAB_VISIBLE = "visible" as const;
export const REVIEW_TAB_HIDDEN = "hidden" as const;

export type ReviewModerationTab =
  | typeof REVIEW_TAB_VISIBLE
  | typeof REVIEW_TAB_HIDDEN;

export type ReviewModerationTabConfig = {
  value: ReviewModerationTab;
  label: string;
  emptyMessage: string;
  isHidden: boolean;
};

export function getReviewModerationTabs(
  messages: Messages,
): ReviewModerationTabConfig[] {
  return [
    {
      value: REVIEW_TAB_VISIBLE,
      label: messages.admin.reviews.tabs.visible,
      emptyMessage: messages.admin.reviews.emptyVisible,
      isHidden: false,
    },
    {
      value: REVIEW_TAB_HIDDEN,
      label: messages.admin.reviews.tabs.hidden,
      emptyMessage: messages.admin.reviews.emptyHidden,
      isHidden: true,
    },
  ];
}

export function resolveReviewTab(
  tabParam: string | undefined,
): ReviewModerationTab {
  return tabParam === REVIEW_TAB_HIDDEN
    ? REVIEW_TAB_HIDDEN
    : REVIEW_TAB_VISIBLE;
}
