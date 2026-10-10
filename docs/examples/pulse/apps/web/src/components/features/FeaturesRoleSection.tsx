import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { FeatureCardGrid } from "@/components/features/FeatureCardGrid";
import { getMessages } from "@/lib/messages/server";

type RoleSectionKey = "shared" | "client" | "trainer" | "admin";

export async function FeaturesRoleSection({ sectionKey }: { sectionKey: RoleSectionKey }) {
  const messages = await getMessages();
  const section = messages.platformFeatures[sectionKey];
  const { statusLabels } = messages.platformFeatures;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <FeatureCardGrid items={section.items} statusLabels={statusLabels} />
    </HowItWasBuiltSection>
  );
}
