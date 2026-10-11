type Anchor = { id: string; label: string };

type LabAnchorBarProps = {
  anchors: readonly Anchor[];
};

/** Sticky in-page navigation; no theme switch (UX-03 D-4). */
export const LabAnchorBar = ({ anchors }: LabAnchorBarProps) => (
  <nav
    aria-label="Design Lab"
    className="sticky top-0 z-30 border-b border-line bg-surface/95 reduce-transparency:bg-surface"
  >
    <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
      {anchors.map((anchor) => (
        <li key={anchor.id} className="shrink-0">
          <a
            href={`#${anchor.id}`}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-line/60"
          >
            {anchor.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);
