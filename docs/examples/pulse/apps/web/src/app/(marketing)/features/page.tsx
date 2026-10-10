import type { Metadata } from "next";

import { FeaturesPageContent } from "@/components/features/FeaturesPageContent";
import { buildPlatformFeaturesMetadata } from "@/lib/features/platform-features-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPlatformFeaturesMetadata();
}

export default function FeaturesPage() {
  return <FeaturesPageContent />;
}
