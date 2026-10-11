import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const alegreya = Alegreya({
  subsets: ["latin", "cyrillic"],
  variable: "--font-alegreya",
  display: "swap",
});

const alegreyaSans = Alegreya_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-alegreya-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sunday School",
  description: "Sunday School — приложение воскресной школы",
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="ru" className={`${alegreya.variable} ${alegreyaSans.variable}`}>
    <body>
      {children}
      <Toaster position="bottom-center" />
    </body>
  </html>
);

export default RootLayout;
