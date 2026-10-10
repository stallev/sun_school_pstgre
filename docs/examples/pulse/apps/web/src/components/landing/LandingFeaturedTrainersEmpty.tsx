import { Container } from "@/components/ui/container";
import { CustomLink } from "@/components/ui/CustomLink";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { getMessages } from "@/lib/messages/server";


export async function LandingFeaturedTrainersEmpty() {
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
        <Empty className="border-border bg-background">
          <EmptyHeader>
            <EmptyTitle>{featured.empty.title}</EmptyTitle>
            <EmptyDescription>{featured.empty.description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CustomLink as="button" href="/trainers" variant="outline">
              {featured.empty.cta}
            </CustomLink>
          </EmptyContent>
        </Empty>
      </Container>
    </section>
  );
}
