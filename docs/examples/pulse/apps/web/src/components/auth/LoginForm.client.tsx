"use client";

import { useActionState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AlertText, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  loginAction,
  type LoginFormState,
} from "@/actions/auth/login";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type LoginFormProps = {
  callbackUrl?: string;
  initialEmail?: string;
  initialPassword?: string;
};

export const LoginForm = ({
  callbackUrl: callbackUrlProp,
  initialEmail,
  initialPassword,
}: LoginFormProps) => {
  const messages = useMessages();
  const searchParams = useSearchParams();
  const callbackUrl = callbackUrlProp ?? searchParams.get("callbackUrl") ?? undefined;
  const [state, formAction, pending] = useActionState<
    LoginFormState,
    FormData
  >(loginAction, null);

  useEffect(() => {
    if (state && !state.ok && state.message) {
      toast.error(state.message, { duration: PRODUCT_TOAST_DURATION_MS });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}

      {state && !state.ok && state.message ? (
        <AlertText>{state.message}</AlertText>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">{messages.auth.login.emailLabel}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            defaultValue={initialEmail}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            {messages.auth.login.passwordLabel}
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
            defaultValue={initialPassword}
          />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="h-12 w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {messages.auth.login.submitting}
          </>
        ) : (
          messages.auth.login.submit
        )}
      </Button>

      <ContentText variant="small" className="text-center">
        {messages.auth.login.noAccount}{" "}
        <CustomLink href="/auth/register">
          {messages.auth.login.registerLink}
        </CustomLink>
      </ContentText>
    </form>
  );
};
