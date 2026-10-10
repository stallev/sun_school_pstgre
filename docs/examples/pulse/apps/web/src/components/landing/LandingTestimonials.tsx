import { Container } from "@/components/ui/container";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { Reveal } from "@/components/ui/Reveal.client";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { getMessages } from "@/lib/messages/server";


export async function LandingTestimonials() {
  const messages = await getMessages();
  const { testimonials } = messages.landing;

  return (
    <section id="reviews" className="py-24">
      <Container variant="marketing">
        <MarketingSectionHeader
          label={testimonials.label}
          title={testimonials.title}
          subtitle={testimonials.subtitle}
          animate
        />
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {testimonials.items.map((item, index) => (
            <Reveal
              key={item.author}
              delay={`${(index + 1) * 100}ms`}
              className="h-full"
            >
              <TestimonialCard
                quote={item.quote}
                author={item.author}
                meta={item.meta}
                avatarColor={
                  item.avatarColor as "primary" | "secondary" | "primaryLight"
                }
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
