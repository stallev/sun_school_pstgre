import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunday School",
  description: "Sunday school: groups, lessons, homework checks, bricks and analytics",
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="ru">
    <body>{children}</body>
  </html>
);

export default RootLayout;
