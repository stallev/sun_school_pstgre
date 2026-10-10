import { ContentText, SectionTitle } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { SpecChip } from "@/components/ui/SpecChip";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import { getMessages } from "@/lib/messages/server";


export type TrainerProfileAboutTabProps = {
  profile: PublicTrainerProfile;
};

export async function TrainerProfileAboutTab({ profile }: TrainerProfileAboutTabProps) {
  const messages = await getMessages();
  return (
    <div className="space-y-4">
      <PulseCard className="p-4 md:p-6">
        <ContentText as="p">
          {profile.bio?.trim() || messages.trainer.profile.aboutEmptyBio}
        </ContentText>
      </PulseCard>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <PulseCard className="flex h-full min-w-0 flex-col p-4 md:p-6">
          <SectionTitle as="h3">{messages.trainer.profile.categoriesTitle}</SectionTitle>
          <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
            {profile.specializations.map((spec) => (
              <SpecChip key={spec.slug}>{spec.name}</SpecChip>
            ))}
          </div>
        </PulseCard>

        <PulseCard className="flex h-full min-w-0 flex-col p-4 md:p-6">
          <SectionTitle as="h3">{messages.trainer.profile.certificatesTitle}</SectionTitle>
          {profile.certificates.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {profile.certificates.map((certificate) => (
                <li key={certificate.id}>
                  <ContentText as="span">{certificate.title}</ContentText>
                </li>
              ))}
            </ul>
          ) : (
            <ContentText variant="muted" as="p" className="mt-3">
              {messages.trainer.profile.aboutEmptyBio}
            </ContentText>
          )}
        </PulseCard>
      </div>
    </div>
  );
}
