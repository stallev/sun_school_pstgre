import type { ReactNode } from "react";

type MatrixCellProps = {
  label: string;
  children: ReactNode;
};

/** One labelled example in a variant × state matrix. */
export const MatrixCell = ({ label, children }: MatrixCellProps) => (
  <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
    <p className="text-sm text-muted">{label}</p>
    <div>{children}</div>
  </div>
);
