"use client";

import { useEffect, useState } from "react";
import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { ContentText } from "@/components/atoms/ContentText";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormCheckbox } from "@/components/ui/form-checkbox";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";

export type RoleSelectorSelection = {
  adminSelected: boolean;
  teacherSelected: boolean;
  selectedGradeIds: string[];
};

type RoleSelectorProps = {
  grades: readonly ActiveGradeOption[];
  initialRoles?: readonly UserRole[];
  initialGradeIds?: readonly string[];
  disabled?: boolean;
  onSelectionChange?: (selection: RoleSelectorSelection) => void;
};

export const RoleSelector = ({
  grades,
  initialRoles = [],
  initialGradeIds = [],
  disabled = false,
  onSelectionChange,
}: RoleSelectorProps) => {
  const messages = useAdminMessages();
  const [adminSelected, setAdminSelected] = useState(initialRoles.includes(USER_ROLE.ADMIN));
  const [teacherSelected, setTeacherSelected] = useState(initialRoles.includes(USER_ROLE.TEACHER));
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>(() => [...initialGradeIds]);

  useEffect(() => {
    onSelectionChange?.({ adminSelected, teacherSelected, selectedGradeIds });
  }, [adminSelected, teacherSelected, selectedGradeIds, onSelectionChange]);

  const toggleGrade = (gradeId: string, checked: boolean) => {
    setSelectedGradeIds((previous) =>
      checked
        ? previous.includes(gradeId)
          ? previous
          : [...previous, gradeId]
        : previous.filter((id) => id !== gradeId),
    );
  };

  return (
    <div className="space-y-4">
      <FieldGroup>
        <FieldLabel>{messages.approvals.rolesLabel}</FieldLabel>
        <label className="flex min-h-11 items-center gap-3">
          <FormCheckbox
            name="roles"
            value={USER_ROLE.ADMIN}
            checked={adminSelected}
            onCheckedChange={setAdminSelected}
            disabled={disabled}
          />
          <ContentText>{messages.approvals.roleAdmin}</ContentText>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <FormCheckbox
            name="roles"
            value={USER_ROLE.TEACHER}
            checked={teacherSelected}
            onCheckedChange={setTeacherSelected}
            disabled={disabled}
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
                <FormCheckbox
                  name="gradeIds"
                  value={grade.gradeId}
                  checked={selectedGradeIds.includes(grade.gradeId)}
                  onCheckedChange={(checked) => toggleGrade(grade.gradeId, checked)}
                  disabled={disabled}
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
