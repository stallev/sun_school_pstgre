"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { ContentText } from "@/components/atoms";
import { DemoRolePanel } from "@/components/auth/DemoRolePanel.client";
import { LoginForm } from "@/components/auth/LoginForm.client";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import {
  DEMO_CREDENTIALS,
  isDemoRole,
  type DemoRole,
} from "@/lib/demo/demo-credentials";

export const LoginPageClientShell = () => {
  const messages = useMessages();
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");

  const [activeRole, setActiveRole] = useState<DemoRole | null>(() =>
    isDemoRole(demoParam) ? demoParam : null,
  );

  const credentials = activeRole ? DEMO_CREDENTIALS[activeRole] : undefined;

  return (
    <div className="space-y-0">
      <DemoRolePanel activeRole={activeRole} onRoleSelect={setActiveRole} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <ContentText
            as="span"
            variant="subtle"
            className="bg-background px-3 text-xs uppercase tracking-wide"
          >
            {messages.auth.demo.dividerLabel}
          </ContentText>
        </div>
      </div>

      <LoginForm
        key={activeRole ?? "manual"}
        initialEmail={credentials?.email}
        initialPassword={credentials?.password}
      />
    </div>
  );
};
