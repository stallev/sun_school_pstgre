/**
 * Typography atoms — single source of truth for headings & body text.
 *
 *  import { Heading, SectionTitle, ContentText, AlertText } from "@/components/atoms";
 *
 *  Deep imports also work:
 *    import { Heading } from "@/components/atoms/Heading/Heading";
 */
export { Heading, type HeadingProps } from "./Heading/Heading";
export { SectionTitle, type SectionTitleProps } from "./SectionTitle/SectionTitle";
export { ContentText, type ContentTextProps } from "./ContentText/ContentText";
export { AlertText, type AlertTextProps } from "./AlertText/AlertText";
export { contentTextVariants, type ContentTextVariant } from "./content-text-variants";
