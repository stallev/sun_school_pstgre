"use client";

import { useTransition } from "react";
import { Loader2Icon, LogOutIcon } from "lucide-react";

import { signOutAction } from "@/actions/auth/sign-out";
import { ContentText, Heading } from "@/components/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";

import type { ClientProfile } from "@/data/client/get-client-profile.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { LocaleSettingsRow } from "@/components/i18n/LocaleSettingsRow";


function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type ClientProfilePanelProps = {
  profile: ClientProfile;
};

export function ClientProfilePanel({ profile }: ClientProfilePanelProps) {
  const messages = useMessages();
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction();
    });
  };

  return (
    <div className="space-y-6 py-4 md:max-w-2xl">
      <Heading as="h1" visualLevel="h2">
        {messages.profile.client.title}
      </Heading>

      <PulseCard className="flex items-center gap-3 p-4">
        <Avatar size="lg">
          {profile.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
          ) : null}
          <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <ContentText as="p" className="truncate text-base font-medium">
            {profile.fullName}
          </ContentText>
          <ContentText variant="mutedMicro" as="p" className="truncate">
            {profile.email}
          </ContentText>
        </div>
      </PulseCard>

      <PulseCard className="p-4">
        <ul className="list-none">
          <LocaleSettingsRow />
        </ul>
      </PulseCard>

      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={handleSignOut}
      >
        {pending ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogOutIcon className="size-4" aria-hidden />
        )}
        {pending
          ? messages.profile.client.signOutPending
          : messages.profile.client.signOut}
      </Button>
    </div>
  );
}
