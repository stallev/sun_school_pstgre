"use client";

import { AlertText, ContentText } from "@/components/atoms";
import { AdminLoginDisclosure } from "@/components/auth/AdminLoginDisclosure.client";
import { ProviderButton } from "@/components/auth/ProviderButton.client";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { BrandMark } from "@/components/patterns/BrandMark";
import { CustomLink } from "@/components/ui/custom-link";

type LoginFormProps = {
  brandLabel: string;
  callbackUrl: string;
  telegramErrorMessage: string | null;
  defaultAdminLoginOpen: boolean;
  initialCredentialsError: string | null;
  showDevBanner: boolean;
};

export const LoginForm = ({
  brandLabel,
  callbackUrl,
  telegramErrorMessage,
  defaultAdminLoginOpen,
  initialCredentialsError,
  showDevBanner,
}: LoginFormProps) => {
  const messages = useAuthMessages();

  return (
    <div>
      <div className="flex items-center gap-3">
        <BrandMark />
        <p className="font-display text-2xl font-medium text-ink">{brandLabel}</p>
      </div>

      <h1 className="mt-10 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
        {messages.login.title}
      </h1>
      <ContentText className="mt-3 text-ink-2">{messages.login.intro}</ContentText>
      {showDevBanner ? <ContentText className="mt-3 text-warn">{messages.login.devBanner}</ContentText> : null}

      {telegramErrorMessage ? (
        <div role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger-soft p-3 text-ink">
          <AlertText>{telegramErrorMessage}</AlertText>
        </div>
      ) : null}

      <div className="mt-8">
        <ProviderButton callbackUrl={callbackUrl} />
      </div>

      <ContentText className="mt-6 text-sm text-ink-2">{messages.login.adminNote}</ContentText>

      <AdminLoginDisclosure
        callbackUrl={callbackUrl}
        defaultOpen={defaultAdminLoginOpen}
        initialCredentialsError={initialCredentialsError}
      />

      <ContentText tone="muted" className="mt-10 text-xs">
        <CustomLink href="/privacy">{messages.login.privacyLink}</CustomLink>
      </ContentText>
    </div>
  );
};
