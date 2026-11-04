import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { RoleSelector, type RoleSelectorSelection } from "@/components/admin/RoleSelector";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type ApprovalRoleSelectProps = {
  grades: readonly ActiveGradeOption[];
  requestedRoles: readonly UserRole[];
  disabled?: boolean;
  onSelectionChange?: (selection: RoleSelectorSelection) => void;
  rolesHint: HintTerm;
  groupsHint: HintTerm;
};

/** Pending requests do not store roles yet; default matches typical teacher application. */
export const resolveDefaultApprovalRoles = (requestedRoles: readonly UserRole[]): UserRole[] =>
  requestedRoles.length > 0 ? [...requestedRoles] : [USER_ROLE.TEACHER];

export const ApprovalRoleSelect = ({
  grades,
  requestedRoles,
  disabled = false,
  onSelectionChange,
  rolesHint,
  groupsHint,
}: ApprovalRoleSelectProps) => (
  <RoleSelector
    grades={grades}
    initialRoles={resolveDefaultApprovalRoles(requestedRoles)}
    disabled={disabled}
    onSelectionChange={onSelectionChange}
    rolesHint={rolesHint}
    groupsHint={groupsHint}
  />
);
