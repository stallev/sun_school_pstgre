import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
});
