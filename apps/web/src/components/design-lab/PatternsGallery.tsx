"use client";

import { useState } from "react";
import { Banner } from "@/components/patterns/Banner";
import { CheckCardHeader } from "@/components/patterns/CheckCardHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { FormSection } from "@/components/patterns/FormSection";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ScoreGroup } from "@/components/patterns/ScoreGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LAB_STUDENT, LAB_TEXT } from "@/lib/design-lab/fixtures";
import { BANNER_TONES, SCORE_MAX } from "@/lib/design-lab/matrices";
import { MatrixCell } from "./MatrixCell";

export const PatternsGallery = () => {
  const [score, setScore] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={LAB_STUDENT.lesson}
        description={LAB_STUDENT.group}
        actions={<Button>{LAB_TEXT.save}</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {BANNER_TONES.map((tone) => (
          <Banner key={tone} tone={tone} title={LAB_TEXT.bannerTitle}>
            {LAB_TEXT.bannerBody}
          </Banner>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <EmptyState
          title={LAB_TEXT.emptyTitle}
          description={LAB_TEXT.emptyBody}
          action={<Button>{LAB_TEXT.save}</Button>}
        />
        <ErrorState
          title={LAB_TEXT.errorTitle}
          description={LAB_TEXT.errorBody}
          action={<Button variant="outline">{LAB_TEXT.retry}</Button>}
        />
        <ForbiddenState title={LAB_TEXT.forbiddenTitle} description={LAB_TEXT.forbiddenBody} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormSection title={LAB_TEXT.fieldLabel} description={LAB_TEXT.fieldHelp}>
          <div className="space-y-1.5">
            <Label htmlFor="lab-pattern-input" className="text-sm font-medium">
              {LAB_TEXT.fieldLabel}
            </Label>
            <Input id="lab-pattern-input" placeholder={LAB_TEXT.fieldPlaceholder} />
          </div>
        </FormSection>
        <MatrixCell label="CheckCardHeader + ScoreGroup">
          <Card>
            <CardContent className="space-y-4">
              <CheckCardHeader
                studentName={LAB_STUDENT.name}
                meta={LAB_STUDENT.group}
                statusLabel={score === null ? "Не проверено" : "Проверено"}
                statusTone={score === null ? "neutral" : "ok"}
              />
              <ScoreGroup
                label={LAB_TEXT.homeworkItem}
                max={SCORE_MAX}
                value={score}
                onValueChange={setScore}
              />
            </CardContent>
          </Card>
        </MatrixCell>
      </div>
    </div>
  );
};
