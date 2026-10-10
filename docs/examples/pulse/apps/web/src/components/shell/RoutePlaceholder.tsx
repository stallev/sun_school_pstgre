import { ContentText, Heading } from "@/components/atoms";
import { getMessages } from "@/lib/messages/server";

type RoutePlaceholderProps = {
  title: string;
  description?: string;
};

export async function RoutePlaceholder({
  title,
  description,
}: RoutePlaceholderProps) {
  const messages = await getMessages();

  return (
    <>
      <Heading as="h1" visualLevel="h3">
        {title}
      </Heading>
      <ContentText variant="bodyMuted" className="mt-4">
        {description ?? messages.placeholders.pageStub}
      </ContentText>
    </>
  );
}
