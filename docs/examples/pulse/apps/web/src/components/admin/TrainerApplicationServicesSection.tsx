import { SectionTitle } from "@/components/atoms";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";


export type TrainerApplicationService = {
  name: string;
  durationMinutes: number;
  priceCents: number;
};

export type TrainerApplicationServicesSectionProps = {
  services: TrainerApplicationService[];
};

export async function TrainerApplicationServicesSection({  services,
}: TrainerApplicationServicesSectionProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <section className="space-y-3">
      <SectionTitle>{messages.admin.moderation.services}</SectionTitle>

      <PulseCard variant="compact" className="rounded-2xl md:max-w-xl ring-1 ring-border">
        <PulseCardContent density="sm">
          <ul className="divide-y divide-border">
            {services.map((service) => (
              <li
                key={`${service.name}-${service.durationMinutes}`}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-muted-foreground">
                  {service.durationMinutes} min ·{" "}
                  {formatMoney(service.priceCents, "USD", locale)}
                </span>
              </li>
            ))}
          </ul>
        </PulseCardContent>
      </PulseCard>
    </section>
  );
}
