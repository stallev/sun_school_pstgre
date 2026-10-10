import Link from "next/link";

import { ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getMessages } from "@/lib/messages/server";


export default async function NotFoundPage() {
  const messages = await getMessages();
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-16"
    >
      <Container variant="narrow" className="text-center">
        <Heading as="h1" visualLevel="h2">
          {messages.notFound.title}
        </Heading>
        <ContentText variant="bodyMuted" className="mt-3">
          {messages.notFound.description}
        </ContentText>
        <Button asChild className="mt-6">
          <Link href="/">{messages.notFound.homeCta}</Link>
        </Button>
      </Container>
    </main>
  );
}
