"use client";

import { CheckIcon } from "lucide-react";
import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { cn } from "@/lib/utils";

type DevRoleMenuGroupProps = {
  shellRole: UserRole;
  previewRole: UserRole;
  onPreviewRoleChange: (role: UserRole) => void;
};

/** Dev-only NAV preview (global_shell_spec §8) — does not change server authorization. */
export const DevRoleMenuGroup = ({
  shellRole,
  previewRole,
  onPreviewRoleChange,
}: DevRoleMenuGroupProps) => {
  const messages = useShellMessages();
  const roleLabel =
    shellRole === USER_ROLE.ADMIN ? messages.roleNameAdmin : messages.roleNameTeacher;

  const options = [
    { value: USER_ROLE.ADMIN, label: messages.devRoleAdmin },
    { value: USER_ROLE.TEACHER, label: messages.devRoleTeacher },
  ];

  return (
    <div
      className="my-1 border-t border-line pt-1.5"
      role="group"
      aria-label={messages.devViewAs}
    >
      <p className="px-2.5 pb-1 text-sm text-muted">
        {messages.devViewAs}: {roleLabel}
      </p>
      {options.map((option) => {
        const isSelected = previewRole === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-base",
              isSelected ? "bg-cobalt-soft font-bold text-cobalt-ink" : "hover:bg-paper",
            )}
            onClick={() => onPreviewRoleChange(option.value)}
          >
            {isSelected ? (
              <CheckIcon className="size-4 shrink-0" aria-hidden />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
