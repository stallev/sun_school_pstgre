import { Heading, ContentText } from "@/components/atoms";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";

type CheckCardHeaderProps = {
  name: string;
  indexLabel: string;
  birthLabel: string;
  points: number;
  pointsLabel: string;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
};

export const CheckCardHeader = ({
  name,
  indexLabel,
  birthLabel,
  points,
  pointsLabel,
  headingRef,
}: CheckCardHeaderProps) => (
  <div className="flex items-center justify-between gap-3 border-b border-line py-3">
    <div className="min-w-0">
      <Heading
        as="h2"
        level="section"
        ref={headingRef}
        tabIndex={-1}
        className="truncate"
      >
        {name}
      </Heading>
      <ContentText tone="secondary" className="text-sm">
        {indexLabel} · {birthLabel}
      </ContentText>
    </div>
    <div className="text-right">
      <NumberDisplay className="font-display text-[1.75rem] leading-none tabular-nums">
        {points}
      </NumberDisplay>
      <ContentText tone="secondary" className="text-xs">{pointsLabel}</ContentText>
    </div>
  </div>
);
