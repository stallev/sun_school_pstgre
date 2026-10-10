import { BottomNav } from "@/components/shell/BottomNav.client";
import { getDiscoveryRoleNav } from "@/components/shell/DiscoveryRoleNav.server";

export async function DiscoveryBottomNavGate() {
  const nav = await getDiscoveryRoleNav();

  if (!nav) {
    return null;
  }

  return <BottomNav items={nav.navItems} badges={nav.badges} />;
}
