import type { Metadata } from "next";

import { Suspense } from "react";

import { TrainerRegisterPageContent } from "@/components/trainer/onboarding/TrainerRegisterPageContent.server";
import { TrainerRegisterPageSkeleton } from "@/components/trainer/onboarding/TrainerRegisterPageSkeleton";
import { getMessages } from "@/lib/messages/server";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.trainer.onboarding.title,
  };
}

type TrainerRegisterPageProps = {
  searchParams: Promise<{ step?: string }>;
};

export default async function TrainerRegisterPage({  searchParams,
}: TrainerRegisterPageProps) {
  const messages = await getMessages();

  return (
    <div className="flex flex-1 flex-col py-4 md:py-8">
      <Suspense fallback={<TrainerRegisterPageSkeleton />}>
        <TrainerRegisterPageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
