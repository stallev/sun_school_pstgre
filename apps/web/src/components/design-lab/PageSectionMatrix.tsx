import { ContentText } from "@/components/atoms/ContentText";
import { PageSection } from "@/components/ui/page-section";
import { MatrixCell } from "./MatrixCell";

const DEMO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.";

export const PageSectionMatrix = () => (
  <div className="space-y-4">
    <MatrixCell label="PageSection width=full">
      <PageSection width="full" className="rounded-lg border border-dashed border-line-strong bg-paper p-3">
        <ContentText>{DEMO}</ContentText>
      </PageSection>
    </MatrixCell>
    <MatrixCell label="PageSection width=wide (max-w-5xl)">
      <PageSection width="wide" className="rounded-lg border border-dashed border-line-strong bg-paper p-3">
        <ContentText>{DEMO}</ContentText>
      </PageSection>
    </MatrixCell>
    <MatrixCell label="PageSection width=form (max-w-3xl)">
      <PageSection width="form" className="rounded-lg border border-dashed border-line-strong bg-paper p-3">
        <ContentText>{DEMO}</ContentText>
      </PageSection>
    </MatrixCell>
  </div>
);
