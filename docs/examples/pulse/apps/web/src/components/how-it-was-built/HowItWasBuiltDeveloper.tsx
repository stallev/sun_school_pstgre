import { LinkIcon, MailIcon, UserRoundIcon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { CustomLink } from "@/components/ui/CustomLink";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltDeveloper() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.developer;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title}>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <Heading as="h3" visualLevel="h2" className="mb-1 text-xl">
          {section.name}
        </Heading>
        <ContentText as="p" variant="statusLabel" className="mb-4 text-primary">
          {section.role}
        </ContentText>
        <ContentText as="p" variant="body" className="mb-6 max-w-2xl leading-relaxed">
          {section.bio}
        </ContentText>
        <ul className="flex flex-wrap gap-3">
          <li>
            <CustomLink
              href={section.githubUrl}
              variant="outline"
              size="sm"
              className="rounded-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIcon aria-hidden className="size-4" />
              {section.links.github}
            </CustomLink>
          </li>
          <li>
            <CustomLink
              href={section.linkedinUrl}
              variant="outline"
              size="sm"
              className="rounded-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <UserRoundIcon aria-hidden className="size-4" />
              {section.links.linkedin}
            </CustomLink>
          </li>
          <li>
            <CustomLink
              href={section.emailHref}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <MailIcon aria-hidden className="size-4" />
              {section.email}
            </CustomLink>
          </li>
        </ul>
      </div>
    </HowItWasBuiltSection>
  );
}
