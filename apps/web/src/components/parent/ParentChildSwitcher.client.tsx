"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ParentChildOption } from "@/data/families/parent-child-access.server";

type ParentChildSwitcherProps = {
  childOptions: ParentChildOption[];
  pupilId: string;
  label: string;
  basePath: string;
};

export const ParentChildSwitcher = ({
  childOptions,
  pupilId,
  label,
  basePath,
}: ParentChildSwitcherProps) => {
  const router = useRouter();
  if (childOptions.length <= 1) return null;

  return (
    <div className="max-w-xs">
      <Label className="mb-1.5 block text-sm text-ink-2">{label}</Label>
      <Select
        value={pupilId}
        onValueChange={(value) => {
          router.push(`${basePath}?pupilId=${value}`);
        }}
      >
        <SelectTrigger className="min-h-11 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {childOptions.map((row) => (
            <SelectItem key={row.pupilId} value={row.pupilId}>
              {row.displayName}
              {row.gradeName ? ` · ${row.gradeName}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
