"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Loader2Icon } from "lucide-react";
import { AlertText, ContentText, Heading, SectionTitle } from "@/components/atoms";
import { ProviderButton } from "@/components/auth/ProviderButton.client";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { toast } from "sonner";

type LoginFormProps = {
  callbackUrl: string;
  errorMessage: string | null;
  showDevBanner: boolean;
};

export const LoginForm = ({ callbackUrl, errorMessage, showDevBanner }: LoginFormProps) => {
  const messages = useAuthMessages();
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleCredentialsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setCredentialsError(null);
    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        const isLocked = result.error === "locked" || result.code === "locked";
        const key = isLocked ? messages.login.locked : messages.login.bad_credentials;
        setCredentialsError(key);
        toast.error(key, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      if (result?.url) {
        window.location.assign(result.url);
      }
    });
  };

  const alertMessage = credentialsError ?? errorMessage;

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <Heading>{messages.login.title}</Heading>
        <ContentText className="text-muted-foreground">{messages.login.intro}</ContentText>
        {showDevBanner ? (
          <ContentText className="text-warn">{messages.login.devBanner}</ContentText>
        ) : null}
      </header>

      {alertMessage ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-ink">
          <AlertText>{alertMessage}</AlertText>
        </div>
      ) : null}

      <ProviderButton callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <ContentText tone="muted" className="text-muted-foreground">{messages.login.divider}</ContentText>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleCredentialsSubmit} className="space-y-4" aria-busy={pending}>
        <SectionTitle>{messages.login.adminTitle}</SectionTitle>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{messages.login.email}</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" required disabled={pending} />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{messages.login.password}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </Field>
        </FieldGroup>
        <Button type="submit" variant="outline" className="min-h-12 w-full" disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {messages.login.submitPending}
            </>
          ) : (
            messages.login.submit
          )}
        </Button>
        <ContentText tone="muted" className="text-muted-foreground">{messages.login.adminNote}</ContentText>
      </form>

      <ContentText tone="muted" className="text-center">
        <CustomLink href="/privacy">{messages.login.privacyLink}</CustomLink>
      </ContentText>
    </div>
  );
};
