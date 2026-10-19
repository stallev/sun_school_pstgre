import { Banner } from "@/components/patterns/Banner";

type ConsentDeadlineBannerProps = {
  title: string;
  description: string;
  isOverdue: boolean;
};

export const ConsentDeadlineBanner = ({ title, description, isOverdue }: ConsentDeadlineBannerProps) => (
  <Banner tone={isOverdue ? "warning" : "info"} title={title} className="mb-4">
    {description}
  </Banner>
);
