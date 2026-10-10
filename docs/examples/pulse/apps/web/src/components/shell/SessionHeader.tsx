import Link from "next/link";

import { SignOutButton } from "@/components/shell/SignOutButton.client";
import { ThemeToggle } from "@/components/shell/ThemeToggle.client";
import { Container } from "@/components/ui/container";
import { getMessages } from "@/lib/messages/server";


export async function SessionHeader() {
  const messages = await getMessages();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container variant="shell" className="flex h-14 items-center gap-3">
        <Link
          href="/client/bookings"
          className="inline-flex min-h-11 items-center rounded-full px-2 font-heading text-lg tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {messages.shell.sessionTitle}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </Container>
    </header>
  );
}
