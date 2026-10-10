import { notFound } from "next/navigation";

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DESIGN_LAB !== "1"
  ) {
    notFound();
  }

  return children;
}
