export type NonEmptyTerm = string & { readonly __nonEmptyTerm: unique symbol };

/** Pure guard. Kept out of the TermLabel client module so Server Components can call it. */
export const nonEmptyTerm = (value: string): NonEmptyTerm => {
  if (value.length === 0) {
    throw new Error("TermLabel term must be non-empty");
  }
  return value as NonEmptyTerm;
};
