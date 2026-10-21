"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScoreCell } from "@/components/ui/score-cell";
import { ScoreSelector } from "@/components/ui/score-selector";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { LAB_SEGMENTS, LAB_TEXT } from "@/lib/design-lab/fixtures";
import { SCORE_MAX } from "@/lib/design-lab/matrices";
import { MatrixCell } from "./MatrixCell";

type Segment = (typeof LAB_SEGMENTS)[number]["value"];

export const ChoiceMatrix = () => {
  const [segment, setSegment] = useState<Segment>("all");
  const [score, setScore] = useState<number | null>(3);
  const [verseScore, setVerseScore] = useState<number | null>(null);
  const [testScore, setTestScore] = useState<number | null>(7);
  const [notebookScore, setNotebookScore] = useState<number | null>(null);
  const [openPadKey, setOpenPadKey] = useState<string | null>(null);
  const [flag, setFlag] = useState(true);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <MatrixCell label="SegmentedControl — arrows / Home / End">
        <SegmentedControl
          aria-label="Segments"
          options={LAB_SEGMENTS}
          value={segment}
          onValueChange={setSegment}
        />
      </MatrixCell>
      <MatrixCell label="SegmentedControl — disabled / invalid">
        <div className="space-y-2">
          <SegmentedControl aria-label="Disabled" options={LAB_SEGMENTS} value="done" onValueChange={() => undefined} disabled />
          <SegmentedControl aria-label="Invalid" options={LAB_SEGMENTS} value={null} onValueChange={() => undefined} invalid />
        </div>
      </MatrixCell>
      <MatrixCell label={`ScoreSelector 0–${SCORE_MAX}`}>
        <ScoreSelector aria-label={LAB_TEXT.homeworkItem} max={SCORE_MAX} value={score} onValueChange={setScore} />
      </MatrixCell>
      <MatrixCell label="ScoreSelector — disabled">
        <ScoreSelector aria-label={LAB_TEXT.homeworkItem} max={SCORE_MAX} value={2} onValueChange={() => undefined} disabled />
      </MatrixCell>
      <MatrixCell label="ScorePad · стих inline 0–2">
        <ScoreCell
          mode="verse"
          max={2}
          value={verseScore}
          onValueChange={setVerseScore}
          notRatedLabel={LAB_TEXT.scoreNotRated}
          aria-label={LAB_TEXT.homeworkItem}
          cellKey="verse"
          openCellKey={openPadKey}
          onOpenCellKeyChange={setOpenPadKey}
        />
      </MatrixCell>
      <MatrixCell label="ScorePad · тест / тетрадь 0–10">
        <div className="flex flex-wrap items-center gap-3">
          <ScoreCell
            mode="pad"
            max={SCORE_MAX}
            value={testScore}
            onValueChange={setTestScore}
            notRatedLabel={LAB_TEXT.scoreNotRated}
            aria-label="Тест"
            cellKey="test"
            openCellKey={openPadKey}
            onOpenCellKeyChange={setOpenPadKey}
          />
          <ScoreCell
            mode="pad"
            max={SCORE_MAX}
            value={notebookScore}
            onValueChange={setNotebookScore}
            notRatedLabel={LAB_TEXT.scoreNotRated}
            aria-label="Тетрадь"
            cellKey="notebook"
            openCellKey={openPadKey}
            onOpenCellKeyChange={setOpenPadKey}
          />
        </div>
      </MatrixCell>
      <MatrixCell label="Checkbox">
        <div className="flex items-center gap-2">
          <Checkbox id="lab-check" defaultChecked />
          <Label htmlFor="lab-check">{LAB_TEXT.fieldLabel}</Label>
        </div>
      </MatrixCell>
      <MatrixCell label="Switch">
        <div className="flex items-center gap-2">
          <Switch id="lab-switch" checked={flag} onCheckedChange={setFlag} />
          <Label htmlFor="lab-switch">{LAB_TEXT.fieldLabel}</Label>
        </div>
      </MatrixCell>
    </div>
  );
};
