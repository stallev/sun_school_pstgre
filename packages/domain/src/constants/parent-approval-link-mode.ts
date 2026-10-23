/** families_and_parents_contract §5 — how admin links an approved parent to children. */
export const PARENT_APPROVAL_LINK_MODE = {
  LINK_EXISTING_ADULT: "link",
  JOIN_CHILD_FAMILY: "join",
  CREATE_FAMILY: "new",
} as const;

export type ParentApprovalLinkMode =
  (typeof PARENT_APPROVAL_LINK_MODE)[keyof typeof PARENT_APPROVAL_LINK_MODE];
