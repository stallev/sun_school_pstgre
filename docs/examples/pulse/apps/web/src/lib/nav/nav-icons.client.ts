"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarIcon,
  DollarSignIcon,
  DumbbellIcon,
  FlagIcon,
  HomeIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import type { NavIconKey } from "@/lib/nav/nav-config";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  home: HomeIcon,
  search: SearchIcon,
  calendar: CalendarIcon,
  user: UserIcon,
  dumbbell: DumbbellIcon,
  users: UsersIcon,
  dollar: DollarSignIcon,
  shield: ShieldIcon,
  flag: FlagIcon,
  refresh: RefreshCwIcon,
  star: StarIcon,
};

export function getNavIcon(iconKey: NavIconKey): LucideIcon {
  return NAV_ICONS[iconKey];
}
