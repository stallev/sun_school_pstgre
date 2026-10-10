import { SidebarNav } from "@/components/shell/SidebarNav.client";
import { getDiscoveryRoleNav } from "@/components/shell/DiscoveryRoleNav.server";

export async function DiscoverySidebarGate() {
  const nav = await getDiscoveryRoleNav();

  if (!nav) {
    return null;
  }

  return (
    <SidebarNav
      items={nav.navItems}
      sectionTitle={nav.sectionTitle}
      badges={nav.badges}
    />
  );
}
