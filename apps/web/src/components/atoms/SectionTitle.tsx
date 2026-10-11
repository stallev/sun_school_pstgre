import type { ComponentProps } from "react";
import { Heading } from "./Heading";

type SectionTitleProps = Omit<ComponentProps<typeof Heading>, "level">;

/** Section heading (`h2`, 20 px display). */
export const SectionTitle = (props: SectionTitleProps) => (
  <Heading level="section" {...props} />
);
