import type { Metadata } from "next";

import { HowItWasBuiltPageContent } from "@/components/how-it-was-built/HowItWasBuiltPageContent";
import { buildHowItWasBuiltMetadata } from "@/lib/how-it-was-built/how-it-was-built-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildHowItWasBuiltMetadata();
}

export default function HowItWasBuiltPage() {
  return <HowItWasBuiltPageContent />;
}
