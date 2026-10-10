import { PulseCard } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


function FeaturedTrainerCardSkeleton() {
  return (
    <PulseCard variant="elevated" className="flex h-full flex-col overflow-hidden rounded-[22px] p-0">
      <Skeleton className="h-[200px] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </PulseCard>
  );
}

export async function LandingFeaturedTrainersSkeleton() {
  const messages = await getMessages();
  const { featured } = messages.landing;

  return (
    <section
      id="trainers"
      aria-busy="true"
      aria-label={featured.title}
      className="bg-card py-24"
    >
      <Container variant="marketing">
        <MarketingSectionHeader
          label={featured.label}
          title={featured.title}
          subtitle={featured.subtitle}
        />
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <FeaturedTrainerCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
