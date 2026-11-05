import { SectionTitle } from "@/components/atoms/SectionTitle";
import { CustomLink } from "@/components/ui/custom-link";
import type { GuideSection } from "@/lib/guide/guide-content-types";

type GuideTocProps = {
  heading: string;
  sections: GuideSection[];
};

export const GuideToc = ({ heading, sections }: GuideTocProps) => (
  <nav aria-label={heading} className="rounded-xl border border-line bg-surface p-4">
    <SectionTitle as="h2" className="mb-3 text-base">
      {heading}
    </SectionTitle>
    <ul className="space-y-2">
      {sections.map((section) => (
        <li key={section.id}>
          <CustomLink href={`#${section.id}`} className="text-base font-normal">
            {section.title}
          </CustomLink>
        </li>
      ))}
    </ul>
  </nav>
);
