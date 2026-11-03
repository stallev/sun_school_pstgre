import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NAV_BADGE_SLOT } from "@/components/shell/nav-config";
import { NavLinkRow } from "./nav-link-row";

vi.mock("@/components/shell/shell-messages-provider.client", () => ({
  useShellMessages: () => ({ badgeInQueue: "{count} in queue" }),
}));

vi.mock("@/components/ui/custom-link", () => ({
  CustomLink: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => (
    <a className={className} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/shell/NavIcon", () => ({
  NavIcon: () => <span data-testid="icon" />,
}));

vi.mock("@/components/shell/nav-badge", () => ({
  NavBadge: () => <span data-testid="badge" />,
}));

const leaf = { key: "today", label: "Today", href: "/today" };

describe("NavLinkRow sidebar density", () => {
  it("active row uses cobalt soft highlight", () => {
    const html = renderToStaticMarkup(
      <NavLinkRow leaf={leaf} isActive density="sidebar" />,
    );
    expect(html).toContain("bg-cobalt-soft");
    expect(html).toContain("font-bold");
    expect(html).toContain("text-cobalt-ink");
  });

  it("inactive row uses ink hover surface", () => {
    const html = renderToStaticMarkup(
      <NavLinkRow leaf={leaf} isActive={false} density="sidebar" />,
    );
    expect(html).toContain("text-ink");
    expect(html).toContain("hover:bg-line/60");
    expect(html).toContain("min-h-10");
    expect(html).toContain("text-base");
  });

  it("rail row uses icon-only metrics and accessible label with badge", () => {
    const html = renderToStaticMarkup(
      <NavLinkRow
        leaf={{
          ...leaf,
          label: "People",
          badgeSlotId: NAV_BADGE_SLOT.APPROVALS,
        }}
        isActive={false}
        density="sidebar"
        collapsed
        badgeCount={3}
      />,
    );
    expect(html).toContain('aria-label="People, 3 in queue"');
    expect(html).toContain('title="People"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain("size-2.5 rounded-full bg-cobalt-ink");
  });

  it("rail row shows visible label on focus-visible", () => {
    const html = renderToStaticMarkup(
      <NavLinkRow leaf={leaf} isActive={false} density="sidebar" collapsed />,
    );
    expect(html).toContain("rail-label");
    expect(html).toMatch(/focus-visible_.rail-label\]:block/);
    expect(html).toContain(">Today<");
  });
});
