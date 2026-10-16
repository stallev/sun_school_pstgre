import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ProductToaster } from "@/components/shell/product-toaster.client";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
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

const RootLayout = async ({ children }: RootLayoutProps) => {
  const locale = await getUiLocale();

  return (
    <html lang={locale} className={`${alegreya.variable} ${alegreyaSans.variable}`}>
      <body>
        {children}
        <ProductToaster />
      </body>
    </html>
  );
};

export default RootLayout;
