import { getDictionary } from "@/lib/messages/get-dictionary";
import { AnalyticsYearsMatrix } from "./AnalyticsYearsMatrix.client";

export const AnalyticsYearsLab = async () => {
  const analyticsDictionary = await getDictionary("ru", "analytics");
  return <AnalyticsYearsMatrix analyticsDictionary={analyticsDictionary} />;
};
