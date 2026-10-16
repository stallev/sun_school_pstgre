"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult, UserRole } from "@sunschool/domain";
import { changeRolesAction } from "@/actions/access-admin";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { RoleSelector } from "@/components/admin/RoleSelector";
import { Button } from "@/components/ui/button";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type UserProfileRolesProps = {
  userId: string;
  initialRoles: readonly UserRole[];
  initialGradeIds: readonly string[];
  grades: readonly ActiveGradeOption[];
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const UserProfileRoles = ({
  userId,
  initialRoles,
  initialGradeIds,
  grades,
  dictionaries,
  formError,
}: UserProfileRolesProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    changeRolesAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.users.toastRolesSaved,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="userId" value={userId} />
      <RoleSelector
        grades={grades}
        initialRoles={initialRoles}
        initialGradeIds={initialGradeIds}
        disabled={pending}
      />
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {messages.approvals.submitPending}
          </>
        ) : (
          messages.users.saveRoles
        )}
      </Button>
    </form>
  );
};
