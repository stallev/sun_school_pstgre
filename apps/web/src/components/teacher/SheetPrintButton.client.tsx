"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SheetPrintButtonProps = {
  label: string;
};

export const SheetPrintButton = ({ label }: SheetPrintButtonProps) => (
  <Button type="button" variant="outline" onClick={() => window.print()}>
    <PrinterIcon className="size-4" aria-hidden />
    {label}
  </Button>
);
