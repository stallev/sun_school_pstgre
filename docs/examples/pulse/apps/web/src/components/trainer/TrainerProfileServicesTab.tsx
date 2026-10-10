import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import { formatServicePrice } from "@/lib/trainer/format-service-price";
import { getLocale, getMessages } from "@/lib/messages/server";

export type TrainerProfileServicesTabProps = {
  profile: PublicTrainerProfile;
};

export async function TrainerProfileServicesTab({
  profile,
}: TrainerProfileServicesTabProps) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <div className="grid items-stretch gap-3 md:grid-cols-2">
      {profile.services.map((service) => (
        <PulseCard key={service.id} className="flex h-full flex-col p-4 md:p-5">
          <Heading as="h3" visualLevel="h4">
            {service.name}
          </Heading>
          {service.description ? (
            <ContentText variant="muted" as="p" className="mt-1 flex-1">
              {service.description}
            </ContentText>
          ) : (
            <div className="flex-1" aria-hidden />
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <ContentText variant="mutedMicro" as="span">
              {messages.common.durationMinutes.replace(
                "{minutes}",
                String(service.durationMinutes),
              )}
            </ContentText>
            <ContentText variant="smallEmphasis" as="span" className="font-heading">
              {formatServicePrice(service.priceCents, service.currency, locale)}
            </ContentText>
          </div>
        </PulseCard>
      ))}
    </div>
  );
}
