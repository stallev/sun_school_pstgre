"use client";

import * as Sentry from "@sentry/nextjs";
import { USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import { homeRouteFor } from "@sunschool/policy-edge";
import { useEffect, useState } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { pickAppSegmentErrorCopy } from "@/lib/messages/app-segment-error-copy";

type AppSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

type SessionUser = {
  status: AccountStatus;
  roles: UserRole[];
};

const AppSegmentError = ({ error, reset }: AppSegmentErrorProps) => {
  const copy = pickAppSegmentErrorCopy();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;
        const payload = (await response.json()) as { user?: SessionUser };
        if (!cancelled && payload.user) {
          setSessionUser(payload.user);
        }
      } catch {
        // Session unavailable — digest stays hidden for non-admin.
      }
    };
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = sessionUser?.roles.includes(USER_ROLE.ADMIN) ?? false;
  const homeHref = sessionUser
    ? homeRouteFor(sessionUser.status, sessionUser.roles)
    : "/today";

  return (
    <ErrorState
      title={copy.title}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="default" onClick={reset}>
            {copy.retry}
          </Button>
          <Button render={<CustomLink href={homeHref} />} variant="outline">
            {copy.home}
          </Button>
        </div>
      }
      footer={
        isAdmin && error.digest ? (
          <ContentText tone="secondary" className="text-sm">
            {copy.digestLabel}: {error.digest}
          </ContentText>
        ) : null
      }
    />
  );
};

export default AppSegmentError;
