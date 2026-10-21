import type { Metadata } from "next";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { resolveShellScreenTitle } from "@/lib/shell/shell-screen-title";

export { PRODUCT_PATHNAME_HEADER } from "@/lib/metadata/product-pathname-header";

export const getProductDocumentSuffix = (common: Dictionary): string =>
  getMessage(common, "shell.document_suffix");

export const buildProductDocumentTitleTemplate = (suffix: string): NonNullable<Metadata["title"]> => ({
  default: suffix,
  template: `%s — ${suffix}`,
});

export const resolveShellRouteDocumentTitle = (
  pathname: string,
  common: Dictionary,
): string | null => {
  const { screenTitles } = pickShellMessages(common);
  return resolveShellScreenTitle(pathname, screenTitles);
};
