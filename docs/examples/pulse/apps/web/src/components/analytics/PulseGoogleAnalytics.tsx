import { GoogleAnalytics } from "@next/third-parties/google";

import {
  getGaMeasurementId,
  isGoogleAnalyticsEnabled,
} from "@/lib/analytics/config";

export function PulseGoogleAnalytics() {
  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }

  return <GoogleAnalytics gaId={getGaMeasurementId()!} />;
}
