import { Suspense } from "react";

import { Heading } from "@/components/atoms";
import { LoginPageClientShell } from "@/components/auth/LoginPageClientShell.client";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


function LoginFormFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
      </div>
      <Skeleton className="h-4 w-32 mx-auto" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

export default async function LoginPage() {
  const messages = await getMessages();
  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <Container variant="narrow" className="mx-auto w-full max-w-2xl px-4">
        <Heading as="h1" className="mb-6 text-center">
          {messages.auth.login.title}
        </Heading>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginPageClientShell />
        </Suspense>
      </Container>
    </div>
  );
}
