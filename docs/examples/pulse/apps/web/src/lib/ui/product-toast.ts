/** Standard toast duration after mutations — see interaction_design_contract.md I1 */
export const PRODUCT_TOAST_DURATION_MS = 2000;

export const PRODUCT_TOAST_QUERY_KEYS = {
  saved: "saved",
  booked: "booked",
  reviewed: "reviewed",
  approved: "approved",
} as const;

export type ProductToastQueryKey =
  (typeof PRODUCT_TOAST_QUERY_KEYS)[keyof typeof PRODUCT_TOAST_QUERY_KEYS];
