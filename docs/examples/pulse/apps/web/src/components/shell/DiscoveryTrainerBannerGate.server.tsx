import { TrainerReviewBanner } from "@/components/shell/TrainerReviewBanner";
import { getDiscoveryRoleNav } from "@/components/shell/DiscoveryRoleNav.server";

export async function DiscoveryTrainerBannerGate() {
  const nav = await getDiscoveryRoleNav();

  if (!nav?.showTrainerReviewBanner) {
    return null;
  }

  return (
    <div className="mb-4">
      <TrainerReviewBanner />
    </div>
  );
}
