export type DeletionRequestedByLineInput = {
  requestedByDisplayName: string;
  requestedByRoleLabel: string | null;
  requestedByEmail: string | null;
  usedNameFallback: boolean;
};

export type DeletionRequestedByLineTemplates = {
  requestedBy: string;
  requestedByWithRole: string;
  requestedByRoleEmail: string;
};

export const formatDeletionRequestedByLine = (
  row: DeletionRequestedByLineInput,
  templates: DeletionRequestedByLineTemplates,
): string => {
  if (row.usedNameFallback) {
    const role = row.requestedByRoleLabel ?? "—";
    const email = row.requestedByEmail ?? "—";
    return templates.requestedByRoleEmail.replace("{role}", role).replace("{email}", email);
  }
  if (row.requestedByRoleLabel) {
    return templates.requestedByWithRole
      .replace("{name}", row.requestedByDisplayName)
      .replace("{role}", row.requestedByRoleLabel);
  }
  return templates.requestedBy.replace("{name}", row.requestedByDisplayName);
};
