import type { ReactNode } from "react";

/** Standalone pages without the application shell (lesson sheet, opened in a new tab). */
export const instant = false;

type SheetGroupLayoutProps = {
  children: ReactNode;
};

const SheetGroupLayout = ({ children }: SheetGroupLayoutProps) => (
  <div className="min-h-dvh bg-background">{children}</div>
);

export default SheetGroupLayout;
