"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { ContentText, SectionTitle } from "@/components/atoms";
import { AchievementCatalogRow } from "@/components/achievements/AchievementCatalogRow";
import { AchievementsPageHeaderActions } from "@/components/achievements/AchievementsPageHeaderActions.client";
import { AchievementsRecalcBar } from "@/components/achievements/AchievementsRecalcBar.client";
import { AchievementsRulesNote } from "@/components/achievements/AchievementsRulesNote.client";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PenaltyCatalogDialog } from "@/components/achievements/PenaltyCatalogDialog.client";
import { RewardCatalogDialog } from "@/components/achievements/RewardCatalogDialog.client";
import { Button } from "@/components/ui/button";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import { REWARD_CATEGORY_ORDER } from "@/lib/achievements/catalog-display";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type AchievementsCatalogBoardProps = {
  rewards: CatalogRowDto[];
  penalties: CatalogRowDto[];
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
  messageLocale: MessageLocale;
  hints: {
    ach_series: HintTerm;
    ach_cumulative: HintTerm;
    ach_recalc: HintTerm;
    ach_levels: HintTerm;
  };
  reviewLesson: GlossaryTerm;
  termHintAriaLabel: string;
};

export const AchievementsCatalogBoard = ({
  rewards,
  penalties,
  messages,
  dictionaries,
  messageLocale,
  hints,
  reviewLesson,
  termHintAriaLabel,
}: AchievementsCatalogBoardProps) => {
  const [rewardEdit, setRewardEdit] = useState<CatalogRowDto | null>(null);
  const [penaltyEdit, setPenaltyEdit] = useState<CatalogRowDto | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);

  const rewardsByCategory = useMemo(() => {
    const map = new Map<string, CatalogRowDto[]>();
    for (const key of REWARD_CATEGORY_ORDER) map.set(key, []);
    for (const row of rewards) {
      const key = row.category ?? "EFFORT";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return map;
  }, [rewards]);

  return (
    <>
      <PageHeader
        title={messages.pageTitle}
        description={messages.pageSubtitle}
        actions={
          <AchievementsPageHeaderActions
            messages={messages}
            onAddReward={() => {
              setRewardEdit(null);
              setRewardOpen(true);
            }}
          />
        }
      />
      <AchievementsRecalcBar
        messages={messages}
        dictionaries={dictionaries}
        recalcHint={hints.ach_recalc}
        termHintAriaLabel={termHintAriaLabel}
      />
      <AchievementsRulesNote
        messages={messages}
        seriesHint={hints.ach_series}
        cumulativeHint={hints.ach_cumulative}
        reviewLesson={reviewLesson}
        termHintAriaLabel={termHintAriaLabel}
      />
      <div className="space-y-8">
        {REWARD_CATEGORY_ORDER.map((category) => {
          const rows = rewardsByCategory.get(category) ?? [];
          return (
            <section key={category}>
              <SectionTitle className="mb-3">{messages.sectionByCategory[category]}</SectionTitle>
              <ul className="divide-y divide-line rounded-xl border border-line bg-card">
                {rows.map((row) => (
                  <AchievementCatalogRow
                    key={row.id}
                    row={row}
                    messages={messages}
                    dictionaries={dictionaries}
                    messageLocale={messageLocale}
                    tierLevelsHint={hints.ach_levels}
                    termHintAriaLabel={termHintAriaLabel}
                    onEdit={() => {
                      setRewardEdit(row);
                      setRewardOpen(true);
                    }}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionTitle>{messages.sectionPenalties}</SectionTitle>
              <ContentText tone="secondary" className="mt-1 max-w-[62ch] text-sm">
                {messages.penaltiesIntro}
              </ContentText>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setPenaltyEdit(null);
                setPenaltyOpen(true);
              }}
            >
              <PlusIcon className="size-4" aria-hidden />
              {messages.addPenalty}
            </Button>
          </div>
          <ul className="divide-y divide-line rounded-xl border border-line bg-card">
            {penalties.map((row) => (
              <AchievementCatalogRow
                key={row.id}
                row={row}
                messages={messages}
                dictionaries={dictionaries}
                messageLocale={messageLocale}
                tierLevelsHint={hints.ach_levels}
                termHintAriaLabel={termHintAriaLabel}
                onEdit={() => {
                  setPenaltyEdit(row);
                  setPenaltyOpen(true);
                }}
              />
            ))}
          </ul>
        </section>
      </div>
      <RewardCatalogDialog
        open={rewardOpen}
        onOpenChange={setRewardOpen}
        row={rewardEdit}
        messages={messages}
        dictionaries={dictionaries}
      />
      <PenaltyCatalogDialog
        open={penaltyOpen}
        onOpenChange={setPenaltyOpen}
        row={penaltyEdit}
        messages={messages}
        dictionaries={dictionaries}
      />
    </>
  );
};
