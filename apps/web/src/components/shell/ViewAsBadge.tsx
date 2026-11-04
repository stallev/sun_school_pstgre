type ViewAsBadgeProps = {
  label: string;
};

export const ViewAsBadge = ({ label }: ViewAsBadgeProps) => (
  <span className="inline shrink-0 rounded-lg border border-line bg-cobalt-soft px-2 py-1 text-sm font-medium text-cobalt-ink">
    {label}
  </span>
);
