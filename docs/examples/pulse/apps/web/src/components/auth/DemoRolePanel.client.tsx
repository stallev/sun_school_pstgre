"use client";

import { DumbbellIcon, ShieldIcon, UserIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import {
  DEMO_CREDENTIALS,
  DEMO_ROLE,
  type DemoRole,
} from "@/lib/demo/demo-credentials";

const ROLE_ICONS: Record<DemoRole, LucideIcon> = {
  client: UserIcon,
  trainer: DumbbellIcon,
  admin: ShieldIcon,
};

type DemoRolePanelProps = {
  activeRole: DemoRole | null;
  onRoleSelect: (role: DemoRole) => void;
};

export const DemoRolePanel = ({
  activeRole,
  onRoleSelect,
}: DemoRolePanelProps) => {
  const messages = useMessages();
  const demoMessages = messages.auth.demo;

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <ContentText as="p" variant="blockLabel">
          {demoMessages.panelTitle}
        </ContentText>
        <ContentText as="p" variant="muted" className="text-sm">
          {demoMessages.panelDescription}
        </ContentText>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
        {DEMO_ROLE.map((role) => {
          const Icon = ROLE_ICONS[role];
          const roleMessages = demoMessages.roles[role];
          const credentials = DEMO_CREDENTIALS[role];

          return (
            <PulseCard
              key={role}
              variant="base"
              interactive
              state={activeRole === role ? "active" : "default"}
              className="flex h-full flex-col gap-3 p-4"
            >
              <Icon aria-hidden className="size-6 text-primary" />
              <ContentText as="p" variant="blockLabel">
                {roleMessages.label}
              </ContentText>
              <ContentText
                as="p"
                variant="muted"
                className="flex-1 text-sm leading-snug"
              >
                {roleMessages.description}
              </ContentText>
              <ContentText
                as="p"
                variant="small"
                className="font-mono text-xs"
              >
                {credentials.email}
              </ContentText>
              <Button
                type="button"
                variant="outline"
                className="mt-auto w-full"
                onClick={() => onRoleSelect(role)}
              >
                {demoMessages.useCredentials}
              </Button>
            </PulseCard>
          );
        })}
      </div>
    </div>
  );
};
