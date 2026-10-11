"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavDrawerProps = {
  trigger: ReactElement;
  title: string;
  closeLabel: string;
  children: ReactNode;
};

/** Left drawer menu: `w-[min(20rem,86vw)]` on `surface` with ink scrim (UX-03 §8). */
export const NavDrawer = ({ trigger, title, closeLabel, children }: NavDrawerProps) => (
  <Sheet>
    <SheetTrigger render={trigger} />
    <SheetContent side="left" closeLabel={closeLabel} className="w-[min(20rem,86vw)] bg-surface">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <nav className="flex flex-col gap-1 px-4 pb-4">{children}</nav>
    </SheetContent>
  </Sheet>
);
