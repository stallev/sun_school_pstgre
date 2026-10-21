"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";

type DevRoleSwitcherProps = {
  previewRole: UserRole;
  onPreviewRoleChange: (role: UserRole) => void;
};

/** Dev-only NAV preview (global_shell_spec §8) — does not change server authorization. */
export const DevRoleSwitcher = ({ previewRole, onPreviewRoleChange }: DevRoleSwitcherProps) => {
  const messages = useShellMessages();

  return (
    <div className="hidden max-w-[min(100%,20rem)] items-center gap-2 md:flex">
      <span className="text-xs text-muted">{messages.devViewAs}</span>
      <SegmentedControl
        value={previewRole}
        onValueChange={(value) => onPreviewRoleChange(value)}
        options={[
          { value: USER_ROLE.ADMIN, label: messages.devRoleAdmin },
          { value: USER_ROLE.TEACHER, label: messages.devRoleTeacher },
        ]}
        aria-label={messages.devViewAs}
      />
    </div>
  );
};
