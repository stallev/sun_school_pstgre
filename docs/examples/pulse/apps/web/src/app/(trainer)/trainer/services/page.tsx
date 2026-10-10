import type { Metadata } from "next";
import { Suspense } from "react";

import { TrainerServicesSection } from "@/components/trainer/TrainerServicesSection.server";
import { getMessages } from "@/lib/messages/server";

import TrainerServicesLoading from "./loading";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.trainer.services.metaTitle,
  };
}

export default function TrainerServicesPage() {
  return (
    <Suspense fallback={<TrainerServicesLoading />}>
      <TrainerServicesSection />
    </Suspense>
  );
}
