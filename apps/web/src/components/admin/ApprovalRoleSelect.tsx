import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { RoleSelector, type RoleSelectorSelection } from "@/components/admin/RoleSelector";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";

type ApprovalRoleSelectProps = {
  grades: readonly ActiveGradeOption[];
  requestedRoles: readonly UserRole[];
  disabled?: boolean;
  onSelectionChange?: (selection: RoleSelectorSelection) => void;
};

/** Pending requests do not store roles yet; default matches typical teacher application. */
export const resolveDefaultApprovalRoles = (requestedRoles: readonly UserRole[]): UserRole[] =>
  requestedRoles.length > 0 ? [...requestedRoles] : [USER_ROLE.TEACHER];

export const ApprovalRoleSelect = ({
  grades,
  requestedRoles,
  disabled = false,
  onSelectionChange,
}: ApprovalRoleSelectProps) => (
  <RoleSelector
    grades={grades}
    initialRoles={resolveDefaultApprovalRoles(requestedRoles)}
    disabled={disabled}
    onSelectionChange={onSelectionChange}
  />
);
