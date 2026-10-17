import { Banner } from "@/components/patterns/Banner";
import { CustomLink } from "@/components/ui/custom-link";
import { Button } from "@/components/ui/button";
import type { ShellBannerView } from "@/data/shell/load-shell-banners.server";

type ShellBannersProps = {
  banners: readonly ShellBannerView[];
};

export const ShellBanners = ({ banners }: ShellBannersProps) => {
  if (banners.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {banners.map((item, index) => (
        <Banner key={`${item.title}-${index}`} tone={item.tone === "warning" ? "warning" : "info"} title={item.title}>
          {item.description ? <p>{item.description}</p> : null}
          {item.actionHref && item.actionLabel ? (
            <CustomLink href={item.actionHref} className="mt-2 inline-block">
              <Button type="button" variant="outline" className="min-h-11">
                {item.actionLabel}
              </Button>
            </CustomLink>
          ) : null}
        </Banner>
      ))}
    </div>
  );
};
