import { Heading } from "@/components/atoms";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


export async function TrainerRegisterPageSkeleton() {
  const messages = await getMessages();
  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 md:px-0"
      aria-busy="true"
      aria-label={messages.trainer.onboarding.title}
    >
      <Heading as="h1" className="mb-6 text-center">
        {messages.trainer.onboarding.title}
      </Heading>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
