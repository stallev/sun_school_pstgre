import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Design Lab",
  robots: { index: false, follow: false },
};

type DesignSystemLayoutProps = {
  children: ReactNode;
};

/**
 * Dev-only catalog (design_system_lab_spec §4): any environment other than `APP_ENV=dev`
 * (prod, preview) answers 404. Read straight from `process.env` so a missing DB / auth
 * secret in preview cannot turn the 404 into a 500; the Lab touches no data and no session.
 */
const DesignSystemLayout = ({ children }: DesignSystemLayoutProps) => {
  if (process.env.APP_ENV !== "dev") {
    notFound();
  }
  return <div className="min-h-dvh bg-paper">{children}</div>;
};

export default DesignSystemLayout;
