import { CustomLink } from "@/components/ui/custom-link";

type SkipToMainLinkProps = {
  label: string;
};

export const SkipToMainLink = ({ label }: SkipToMainLinkProps) => (
  <CustomLink
    href="#main"
    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-float focus:no-underline"
  >
    {label}
  </CustomLink>
);
