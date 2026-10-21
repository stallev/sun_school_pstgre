import "server-only";

import type { Metadata } from "next";
import { headers } from "next/headers";

import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import {
  buildProductDocumentTitleTemplate,
  getProductDocumentSuffix,
} from "@/lib/metadata/product-document-title";
import { PRODUCT_PATHNAME_HEADER } from "@/lib/metadata/product-pathname-header";
export {
  buildProductDocumentTitleTemplate,
  getProductDocumentSuffix,
  resolveShellRouteDocumentTitle,
} from "@/lib/metadata/product-document-title";

export const readRequestPathname = async (): Promise<string | null> => {
  const headerStore = await headers();
  const raw = headerStore.get(PRODUCT_PATHNAME_HEADER);
  if (!raw) return null;
  return raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
};

export const loadProductRootMetadata = async (
  locale: MessageLocale,
): Promise<Pick<Metadata, "title" | "description">> => {
  const common = await getDictionary(locale, "common");
  const suffix = getProductDocumentSuffix(common);
  return {
    title: buildProductDocumentTitleTemplate(suffix),
    description: getMessage(common, "shell.document_description"),
  };
};
