import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";

export const formatGlobalPoints = (row: GroupPointsTableRowDto): string => {
  if (row.isPenalty) return `−${Math.abs(row.globalPoints)}`;
  return `+${row.globalPoints}`;
};

const formatPointsValue = (points: number, isPenalty: boolean): string => {
  if (isPenalty) return `−${Math.abs(points)}`;
  return `+${points}`;
};

/** Read-only group column: override when set, otherwise inherited global value. */
export const formatGroupPointsDisplay = (row: GroupPointsTableRowDto): string => {
  if (row.overridePoints !== null) {
    return formatPointsValue(row.overridePoints, row.isPenalty);
  }
  return formatGlobalPoints(row);
};
