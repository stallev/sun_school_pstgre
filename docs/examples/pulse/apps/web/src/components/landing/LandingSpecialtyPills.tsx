import { Container } from "@/components/ui/container";
import { DiscoveryPill } from "@/components/ui/DiscoveryPill";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { Reveal } from "@/components/ui/Reveal.client";
import { getMessages } from "@/lib/messages/server";


export async function LandingSpecialtyPills() {
  const messages = await getMessages();
  const { specialties } = messages.landing;

  return (
    <section className="py-24">
      <Container variant="marketing">
        <MarketingSectionHeader
          label={specialties.label}
          title={specialties.title}
          subtitle={specialties.subtitle}
          animate
        />
        <Reveal delay="100ms" className="flex flex-wrap justify-center gap-3">
          {specialties.items.map((item) => (
            <DiscoveryPill
              key={item.slug}
              href={`/trainers?specialty=${item.slug}`}
              label={item.label}
              count={item.count}
            />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
