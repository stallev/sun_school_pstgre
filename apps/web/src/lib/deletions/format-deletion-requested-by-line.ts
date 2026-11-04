export type DeletionRequestedByLineInput = {
  requestedByDisplayName: string;
  requestedByRoleLabel: string | null;
};

export type DeletionRequestedByLineTemplates = {
  requestedBy: string;
  requestedByWithRole: string;
};

export const formatDeletionRequestedByLine = (
  row: DeletionRequestedByLineInput,
  templates: DeletionRequestedByLineTemplates,
): string => {
  if (row.requestedByRoleLabel) {
    return templates.requestedByWithRole
      .replace("{name}", row.requestedByDisplayName)
      .replace("{role}", row.requestedByRoleLabel);
  }
  return templates.requestedBy.replace("{name}", row.requestedByDisplayName);
};
