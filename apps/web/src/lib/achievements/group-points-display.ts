import { ACHIEVEMENT_RULE_TYPE } from "@sunschool/domain";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import { fillMessage } from "@/lib/messages/fill-message";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

export const formatGlobalPoints = (row: GroupPointsTableRowDto): string => {
  if (row.isPenalty) return `−${Math.abs(row.globalPoints)}`;
  return `+${row.globalPoints}`;
};

/** Human-readable earning condition; penalties and unknown rule types keep the catalog text. */
export const formatGroupPointsCondition = (
  row: GroupPointsTableRowDto,
  messages: GroupPointsMessages,
): string => {
  if (row.tierLength === null) return row.conditionLabel;
  switch (row.ruleType) {
    case ACHIEVEMENT_RULE_TYPE.SERIES:
      return fillMessage(messages.conditionSeries, { length: row.tierLength });
    case ACHIEVEMENT_RULE_TYPE.ACCUMULATION:
      return fillMessage(messages.conditionAccumulation, { length: row.tierLength });
    case ACHIEVEMENT_RULE_TYPE.ONCE:
      return messages.conditionOnce;
    case ACHIEVEMENT_RULE_TYPE.EVENT:
      return messages.conditionEvent;
    default:
      return row.conditionLabel;
  }
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
