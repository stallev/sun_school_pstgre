import { ArrowRightIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { CustomLink } from "@/components/ui/CustomLink";
import { getMessages } from "@/lib/messages/server";

export async function FeaturesBoundaries() {
  const messages = await getMessages();
  const section = messages.platformFeatures.boundaries;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <ContentText variant="muted" as="p" className="mb-6 text-sm leading-relaxed">
        {section.plannedNote}
      </ContentText>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {section.tableHeaders.feature}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {section.tableHeaders.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.feature} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3 align-top font-medium text-foreground">
                  {item.feature}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CustomLink
        href={section.roadmapHref}
        className="mt-5 inline-flex items-center gap-1.5 font-medium text-primary"
      >
        {section.roadmapLink}
        <ArrowRightIcon aria-hidden className="size-4" />
      </CustomLink>
    </HowItWasBuiltSection>
  );
}
