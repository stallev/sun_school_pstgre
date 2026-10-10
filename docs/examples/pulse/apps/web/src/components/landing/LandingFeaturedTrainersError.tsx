import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { getMessages } from "@/lib/messages/server";


import { LandingFeaturedTrainersRetryButton } from "./LandingFeaturedTrainersRetryButton.client";

export async function LandingFeaturedTrainersError() {
  const messages = await getMessages();
  const { featured } = messages.landing;

  return (
    <section id="trainers" className="bg-card py-24">
      <Container variant="marketing">
        <MarketingSectionHeader
          label={featured.label}
          title={featured.title}
          subtitle={featured.subtitle}
        />
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden />
          <AlertTitle>{featured.error.title}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{featured.error.description}</span>
            <LandingFeaturedTrainersRetryButton />
          </AlertDescription>
        </Alert>
      </Container>
    </section>
  );
}
