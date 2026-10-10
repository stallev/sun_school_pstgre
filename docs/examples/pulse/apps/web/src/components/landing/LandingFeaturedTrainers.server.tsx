import { FeaturedTrainerCard } from "@/components/catalog/FeaturedTrainerCard";
import { getFeaturedTrainers } from "@/data/catalog/get-featured-trainers.server";
import { Container } from "@/components/ui/container";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { Reveal } from "@/components/ui/Reveal.client";
import { getMessages } from "@/lib/messages/server";


import { LandingFeaturedTrainersBrowseCta } from "./LandingFeaturedTrainersBrowseCta.client";
import { LandingFeaturedTrainersEmpty } from "./LandingFeaturedTrainersEmpty";
import { LandingFeaturedTrainersError } from "./LandingFeaturedTrainersError";

export async function LandingFeaturedTrainers() {
  const messages = await getMessages();
  const { featured } = messages.landing;

  let trainers;

  try {
    trainers = await getFeaturedTrainers();
  } catch {
    return <LandingFeaturedTrainersError />;
  }

  if (trainers.length === 0) {
    return <LandingFeaturedTrainersEmpty />;
  }

  return (
    <section id="trainers" className="bg-card py-24">
      <Container variant="marketing">
        <MarketingSectionHeader
          label={featured.label}
          title={featured.title}
          subtitle={featured.subtitle}
          animate
        />
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trainers.slice(0, 3).map((trainer, index) => (
            <Reveal
              key={trainer.id}
              delay={`${(index + 1) * 100}ms`}
              className="h-full"
            >
              <FeaturedTrainerCard trainer={trainer} imagePriority={index === 0} />
            </Reveal>
          ))}
        </div>
        <LandingFeaturedTrainersBrowseCta label={featured.browseAll} />
      </Container>
    </section>
  );
}
