import { UserRoundIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarSize,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function UserAvatar({ name, src, size = "default", className }: UserAvatarProps) {
  const hasPhoto = Boolean(src?.trim());

  return (
    <Avatar size={size} className={className}>
      {hasPhoto ? <AvatarImage src={src!} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          hasPhoto
            ? undefined
            : "bg-muted text-muted-foreground",
        )}
      >
        {hasPhoto ? (
          name
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
        ) : (
          <UserRoundIcon aria-hidden className="size-[55%]" strokeWidth={1.5} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
