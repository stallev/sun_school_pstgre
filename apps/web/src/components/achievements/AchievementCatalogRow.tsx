"use client";

import { FlagIcon } from "lucide-react";
import { ContentText } from "@/components/atoms";
import { AchievementCatalogToggle } from "@/components/achievements/AchievementCatalogToggle.client";
import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import { isPenaltyRow, PRACTICE_ACHIEVEMENT_CODE } from "@/lib/achievements/catalog-display";
import { splitAchievementRuleText } from "@/lib/achievements/split-achievement-rule-text";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { fillMessage } from "@/lib/messages/fill-message";
import { formatPlural } from "@/lib/messages/plural";

type AchievementCatalogRowProps = {
  row: CatalogRowDto;
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
  messageLocale: MessageLocale;
  onEdit: () => void;
};

const formatStatus = (row: CatalogRowDto, messages: AchievementsCatalogMessages): string => {
  if (row.code === PRACTICE_ACHIEVEMENT_CODE) return messages.statusPracticePending;
  return row.isActive ? messages.statusEnabled : messages.statusDisabled;
};

const formatTierLine = (
  row: CatalogRowDto,
  tier: CatalogRowDto["tiers"][number],
  messages: AchievementsCatalogMessages,
  messageLocale: MessageLocale,
): string => {
  const lessons = formatPlural(messages.tierLessonsPlural, tier.length, messageLocale);
  const tierLabel = row.tiers.length > 1 ? messages.tierLabels[tier.tier - 1] : "";
  const prefix = tierLabel ? `${tierLabel}: ` : "";
  return fillMessage(messages.tierAfterLessons, {
    prefix,
    count: tier.length,
    lessons,
    points: tier.points,
  });
};

export const AchievementCatalogRow = ({
  row,
  messages,
  dictionaries,
  messageLocale,
  onEdit,
}: AchievementCatalogRowProps) => {
  const penalty = isPenaltyRow(row);
  const statusClass = row.isActive || row.code === PRACTICE_ACHIEVEMENT_CODE ? "text-ink-2" : "text-muted";
  const rule = splitAchievementRuleText(row.descriptionRu);

  return (
    <li className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center md:gap-6">
      <button type="button" onClick={onEdit} className="min-w-0 text-left">
        <span className="flex items-center gap-2 font-medium hover:text-cobalt-ink">
          {penalty ? <FlagIcon className="size-4 text-penalty" aria-hidden /> : null}
          {row.nameRu}
        </span>
        {rule.summary ? (
          <ContentText tone="secondary" className="mt-0.5 block text-sm">
            {rule.summary}
          </ContentText>
        ) : null}
        {rule.details ? (
          <details className="mt-1 text-sm">
            <summary className="cursor-pointer text-cobalt-ink hover:underline">
              {messages.ruleHowCounted}
            </summary>
            <ContentText tone="secondary" className="mt-1 block text-sm">
              {rule.details}
            </ContentText>
          </details>
        ) : null}
      </button>
      {penalty ? (
        <p className="text-sm">
          <span className="font-bold tabular-nums text-penalty">{row.threshold}</span>
          <span className="text-ink-2">
            {" "}
            · {messages.activePenalties.replace("{count}", String(row.activePenaltyCount))}
          </span>
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {row.tiers.map((tier) => (
            <span key={tier.tier} className="inline-flex items-center gap-2 text-sm">
              <AchievementTierDot tierIndex={tier.tier - 1} />
              <span className="text-ink-2">
                {formatTierLine(row, tier, messages, messageLocale)}
              </span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className={`text-sm ${statusClass}`}>{formatStatus(row, messages)}</span>
        <AchievementCatalogToggle
          achievementId={row.id}
          code={row.code}
          nameRu={row.nameRu}
          isActive={row.isActive}
          messages={messages}
          dictionaries={dictionaries}
        />
      </div>
    </li>
  );
};
