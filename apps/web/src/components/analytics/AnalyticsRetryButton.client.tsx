"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type AnalyticsRetryButtonProps = {
  retryLabel: string;
};

export const AnalyticsRetryButton = ({ retryLabel }: AnalyticsRetryButtonProps) => {
  const router = useRouter();
  return (
    <Button type="button" variant="outline" onClick={() => router.refresh()}>
      {retryLabel}
    </Button>
  );
};
