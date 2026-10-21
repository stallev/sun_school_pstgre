import { Heading, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Card } from "@/components/ui/card";

type CheckFinishedCardProps = {
  title: string;
  subtitle: string;
  progressLabel: string;
  linkTableLabel: string;
  linkBricksLabel: string;
  lessonId: string;
};

export const CheckFinishedCard = ({
  title,
  subtitle,
  progressLabel,
  linkTableLabel,
  linkBricksLabel,
  lessonId,
}: CheckFinishedCardProps) => (
  <Card className="max-w-2xl space-y-4 p-4 sm:p-5">
    <div className="space-y-1">
      <Heading level="page">{title}</Heading>
      <ContentText tone="secondary">{subtitle}</ContentText>
    </div>
    <ContentText className="text-ink-2">{progressLabel}</ContentText>
    <div className="flex flex-wrap gap-2">
      <Button render={<CustomLink href="/bricks" />}>{linkBricksLabel}</Button>
      <Button variant="outline" render={<CustomLink href={`/lessons/${lessonId}/table`} />}>
        {linkTableLabel}
      </Button>
    </div>
  </Card>
);
