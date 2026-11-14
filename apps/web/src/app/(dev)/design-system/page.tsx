import { ButtonMatrix } from "@/components/design-lab/ButtonMatrix";
import { ChoiceMatrix } from "@/components/design-lab/ChoiceMatrix";
import { ColorGrid } from "@/components/design-lab/ColorGrid";
import { ContrastTable } from "@/components/design-lab/ContrastTable";
import { FeedbackMatrix } from "@/components/design-lab/FeedbackMatrix";
import { FieldMatrix } from "@/components/design-lab/FieldMatrix";
import { DateFieldMatrix } from "@/components/design-lab/DateFieldMatrix";
import { PageSectionMatrix } from "@/components/design-lab/PageSectionMatrix";
import { LabAnchorBar } from "@/components/design-lab/LabAnchorBar";
import { LabSection } from "@/components/design-lab/LabSection";
import { OverlayMatrix } from "@/components/design-lab/OverlayMatrix";
import { PatternsGallery } from "@/components/design-lab/PatternsGallery";
import { ShellMatrix } from "@/components/design-lab/ShellMatrix";
import { ShapeMotion } from "@/components/design-lab/ShapeMotion";
import { TableMatrix } from "@/components/design-lab/TableMatrix";
import { SpacingScale } from "@/components/design-lab/SpacingScale";
import { FieldHeights } from "@/components/design-lab/FieldHeights";
import { TypeScale } from "@/components/design-lab/TypeScale";
import { WidthFrame } from "@/components/design-lab/WidthFrame";
import { TermHintMatrix } from "@/components/design-lab/TermHintMatrix";
import { RowActionsMenuMatrix } from "@/components/design-lab/RowActionsMenuMatrix";
import {
  termHintLabSection,
  rowActionsMenuLabSection,
  spacingScaleLabSection,
  fieldHeightsLabSection,
} from "@/lib/design-lab/sections";
import { SuggestionConfirmLab } from "@/components/design-lab/SuggestionConfirmLab";
import { AchievementsCatalogLab } from "@/components/design-lab/AchievementsCatalogLab";
import { FamilyAdminLab } from "@/components/design-lab/FamilyAdminLab";
import { AnalyticsYearsLab } from "@/components/design-lab/AnalyticsYearsLab";
import { Heading } from "@/components/atoms/Heading";
import { ContentText } from "@/components/atoms/ContentText";

const ANCHORS = [
  { id: "colors", label: "Colors" },
  { id: "contrast", label: "Contrast" },
  { id: "type", label: "Type" },
  { id: "shape", label: "Shape & motion" },
  { id: spacingScaleLabSection.id, label: spacingScaleLabSection.anchorLabel },
  { id: fieldHeightsLabSection.id, label: fieldHeightsLabSection.anchorLabel },
  { id: "buttons", label: "Buttons" },
  { id: "fields", label: "Fields" },
  { id: "choices", label: "Choices" },
  { id: "feedback", label: "Feedback" },
  { id: termHintLabSection.id, label: termHintLabSection.anchorLabel },
  { id: rowActionsMenuLabSection.id, label: rowActionsMenuLabSection.anchorLabel },
  { id: "overlays", label: "Overlays" },
  { id: "tables", label: "Tables" },
  { id: "patterns", label: "Patterns" },
  { id: "shell", label: "Shell" },
  { id: "analytics-years", label: "Analytics years" },
  { id: "achievements-catalog", label: "Achievements catalog" },
  { id: "suggestion-confirm", label: "Suggestion confirm" },
  { id: "family-admin", label: "Family admin" },
] as const;

const DesignSystemPage = () => (
  <>
    <LabAnchorBar anchors={ANCHORS} />
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <header className="space-y-2">
        <Heading>Design Lab</Heading>
        <ContentText tone="secondary">
          Catalog of tokens, primitives and patterns (L1 – L3). Dev only; light theme only.
        </ContentText>
      </header>

      <LabSection id="colors" title="L1 · Colors" hint="UX-03 §4 — Slate Cobalt palette and reserved tokens">
        <ColorGrid />
      </LabSection>
      <LabSection id="contrast" title="L1 · Contrast" hint="UX-03 §5 — recomputed from token values">
        <ContrastTable />
      </LabSection>
      <LabSection id="type" title="L1 · Typography" hint="Alegreya (display) · Source Sans 3 (body), 18 px base">
        <TypeScale />
      </LabSection>
      <LabSection id="shape" title="L1 · Shape, depth, motion">
        <ShapeMotion />
      </LabSection>

      <LabSection
        id={spacingScaleLabSection.id}
        title={spacingScaleLabSection.title}
        hint={spacingScaleLabSection.hint}
      >
        <SpacingScale />
      </LabSection>

      <LabSection id="buttons" title="L2 · Button" hint="variant × state × size">
        <ButtonMatrix />
      </LabSection>
      <LabSection id="fields" title="L2 · Input / Textarea / Field" hint="UX-03 D-7: field border is muted">
        <FieldMatrix />
      </LabSection>
      <LabSection
        id={fieldHeightsLabSection.id}
        title={fieldHeightsLabSection.title}
        hint={fieldHeightsLabSection.hint}
      >
        <FieldHeights />
      </LabSection>
      <LabSection id="date-field" title="L2 · DateField" hint="ISO value, locale display, calendar popover">
        <DateFieldMatrix />
      </LabSection>
      <LabSection id="choices" title="L2 · SegmentedControl, ScoreSelector, Checkbox, Switch">
        <ChoiceMatrix />
      </LabSection>
      <LabSection id="feedback" title="L2 · Badge, Progress, Status, Skeleton, Toast">
        <FeedbackMatrix />
      </LabSection>
      <LabSection
        id={termHintLabSection.id}
        title={termHintLabSection.title}
        hint={termHintLabSection.hint}
      >
        <TermHintMatrix />
      </LabSection>
      <LabSection
        id={rowActionsMenuLabSection.id}
        title={rowActionsMenuLabSection.title}
        hint={rowActionsMenuLabSection.hint}
      >
        <RowActionsMenuMatrix />
      </LabSection>
      <LabSection id="overlays" title="L2 · Dialog, Sheet, Disclosure, Select">
        <OverlayMatrix />
      </LabSection>
      <LabSection id="tables" title="L2 · Table">
        <TableMatrix />
      </LabSection>

      <LabSection id="patterns" title="L3 · Patterns" hint="Container width: 390 / 768 / 1280 px">
        <WidthFrame>
          <PatternsGallery />
        </WidthFrame>
      </LabSection>
      <LabSection id="page-section" title="L2 · PageSection" hint="full / wide / form — left-aligned, no mx-auto">
        <PageSectionMatrix />
      </LabSection>

      <LabSection id="shell" title="L3 · Shell" hint="global_shell_spec §4 — navigation chrome">
        <ShellMatrix />
      </LabSection>

      <LabSection
        id="analytics-years"
        title="L3 · Analytics by year"
        hint="YearStrip, YearTotalsTable, DiffBadge, KpiTiles, pupil years — prototype §5.5 / §6.5"
      >
        <WidthFrame>
          <AnalyticsYearsLab />
        </WidthFrame>
      </LabSection>

      <LabSection
        id="achievements-catalog"
        title="L3 · Achievements catalog"
        hint="vAchievements, achDialog, penCatDialog — achievements_screens §4"
      >
        <WidthFrame>
          <AchievementsCatalogLab />
        </WidthFrame>
      </LabSection>

      <LabSection
        id="suggestion-confirm"
        title="L3 · Suggestion confirm"
        hint="Ждёт подтверждения, список текстов серии — achievements_screens §5.8"
      >
        <WidthFrame>
          <SuggestionConfirmLab />
        </WidthFrame>
      </LabSection>

      <LabSection
        id="family-admin"
        title="L3 · Family admin"
        hint="vFamily — families_and_parents_screens §5.1"
      >
        <WidthFrame>
          <FamilyAdminLab />
        </WidthFrame>
      </LabSection>
    </main>
  </>
);

export default DesignSystemPage;
