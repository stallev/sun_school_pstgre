"use client";

import { useState } from "react";
import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { ContentText } from "@/components/atoms/ContentText";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";

type RoleSelectorProps = {
  grades: readonly ActiveGradeOption[];
  initialRoles?: readonly UserRole[];
  initialGradeIds?: readonly string[];
  disabled?: boolean;
};

export const RoleSelector = ({
  grades,
  initialRoles = [],
  initialGradeIds = [],
  disabled = false,
}: RoleSelectorProps) => {
  const messages = useAdminMessages();
  const [teacherSelected, setTeacherSelected] = useState(initialRoles.includes(USER_ROLE.TEACHER));

  return (
    <div className="space-y-4">
      <FieldGroup>
        <FieldLabel>{messages.approvals.rolesLabel}</FieldLabel>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="roles"
            value={USER_ROLE.ADMIN}
            defaultChecked={initialRoles.includes(USER_ROLE.ADMIN)}
            disabled={disabled}
            className="size-4 rounded border border-input"
          />
          <ContentText>{messages.approvals.roleAdmin}</ContentText>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="roles"
            value={USER_ROLE.TEACHER}
            defaultChecked={initialRoles.includes(USER_ROLE.TEACHER)}
            disabled={disabled}
            className="size-4 rounded border border-input"
            onChange={(event) => setTeacherSelected(event.currentTarget.checked)}
          />
          <ContentText>{messages.approvals.roleTeacher}</ContentText>
        </label>
      </FieldGroup>

      {teacherSelected ? (
        <FieldGroup>
          <FieldLabel>{messages.approvals.groupsLabel}</FieldLabel>
          {grades.length === 0 ? (
            <ContentText tone="secondary">{messages.approvals.groupsLabel}</ContentText>
          ) : (
            grades.map((grade) => (
              <label key={grade.gradeId} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  name="gradeIds"
                  value={grade.gradeId}
                  defaultChecked={initialGradeIds.includes(grade.gradeId)}
                  disabled={disabled}
                  className="size-4 rounded border border-input"
                />
                <ContentText>{grade.name}</ContentText>
              </label>
            ))
          )}
        </FieldGroup>
      ) : null}
    </div>
  );
};
