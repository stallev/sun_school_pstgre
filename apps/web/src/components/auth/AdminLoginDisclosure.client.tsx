"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { ChevronDownIcon, ChevronUpIcon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { AlertText, ContentText } from "@/components/atoms";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

const ADMIN_PANEL_ID = "admin-login-panel";

type AdminLoginDisclosureProps = {
  callbackUrl: string;
  defaultOpen: boolean;
  initialCredentialsError: string | null;
};

export const AdminLoginDisclosure = ({
  callbackUrl,
  defaultOpen,
  initialCredentialsError,
}: AdminLoginDisclosureProps) => {
  const messages = useAuthMessages();
  const [isAdminLoginOpen, setAdminLoginOpen] = useState(defaultOpen);
  const [credentialsError, setCredentialsError] = useState<string | null>(initialCredentialsError);
  const [pending, startTransition] = useTransition();

  const handleCredentialsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setCredentialsError(null);
    setAdminLoginOpen(true);
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

  const toggleLabel = isAdminLoginOpen ? messages.login.adminHide : messages.login.adminTitle;

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="link"
        className="min-h-11 h-auto px-0 text-ink-2"
        aria-expanded={isAdminLoginOpen}
        aria-controls={ADMIN_PANEL_ID}
        onClick={() => setAdminLoginOpen((open) => !open)}
      >
        {toggleLabel}
        {isAdminLoginOpen ? (
          <ChevronUpIcon className="size-4" aria-hidden />
        ) : (
          <ChevronDownIcon className="size-4" aria-hidden />
        )}
      </Button>

      {isAdminLoginOpen ? (
        <div
          id={ADMIN_PANEL_ID}
          role="region"
          aria-labelledby="admin-login-heading"
          className="mt-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <ContentText tone="muted" className="text-muted-foreground">{messages.login.divider}</ContentText>
            <div className="h-px flex-1 bg-line" />
          </div>

          {credentialsError ? (
            <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-ink">
              <AlertText>{credentialsError}</AlertText>
            </div>
          ) : null}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4" aria-busy={pending}>
            <h2 id="admin-login-heading" className="text-sm font-medium text-ink-2">
              {messages.login.adminTitle}
            </h2>
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
            <Button
              type="submit"
              variant="outline"
              className={FORM_SUBMIT_BUTTON_CLASS}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.login.submitPending}
                </>
              ) : (
                <>
                  <KeyRoundIcon className="size-4" aria-hidden />
                  {messages.login.submit}
                </>
              )}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
};
