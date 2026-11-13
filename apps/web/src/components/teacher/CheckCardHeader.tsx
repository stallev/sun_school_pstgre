import { Heading, ContentText } from "@/components/atoms";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";

type CheckCardHeaderProps = {
  name: string;
  indexLabel: string;
  birthLabel: string;
  points: number;
  pointsLabel: string;
  filledLabel: string;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
};

export const CheckCardHeader = ({
  name,
  indexLabel,
  birthLabel,
  points,
  pointsLabel,
  filledLabel,
  headingRef,
}: CheckCardHeaderProps) => (
  <div className="flex flex-col gap-chip border-b border-line py-3 md:flex-row md:items-center md:justify-between">
    <div className="min-w-0">
      <Heading
        as="h2"
        level="section"
        ref={headingRef}
        tabIndex={-1}
        className="break-words text-[1.5rem] leading-tight"
      >
        {name}
      </Heading>
      <ContentText tone="secondary" className="text-sm">
        {indexLabel} · {birthLabel}
      </ContentText>
    </div>
    <div className="flex flex-wrap items-baseline gap-x-chip md:block md:text-right">
      <NumberDisplay className="text-[1.75rem] leading-none">
        {points}
      </NumberDisplay>
      <ContentText tone="secondary" className="text-xs">{pointsLabel}</ContentText>
      <ContentText className="w-full text-xs tabular-nums text-ink-2 md:w-auto">{filledLabel}</ContentText>
    </div>
  </div>
);
