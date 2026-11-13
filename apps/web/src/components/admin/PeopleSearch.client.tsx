"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";

const DEBOUNCE_MS = 300;

type PeopleSearchProps = {
  initialQuery: string;
};

export const PeopleSearch = ({ initialQuery }: PeopleSearchProps) => {
  const messages = useAdminMessages();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = value.trim();
      const currentQ = searchParams.get("q") ?? "";
      if (trimmed === currentQ.trim()) return;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed.length === 0) {
        params.delete("q");
      } else {
        params.set("q", trimmed);
      }
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  const trimmedValue = value.trim();
  const showMinHint = trimmedValue.length === 1;
  const hintId = showMinHint ? "people-search-min-hint" : undefined;

  return (
    <div className="flex flex-col gap-label">
      <label htmlFor="people-search" className="text-sm font-medium text-ink">
        {messages.people.searchLabel}
      </label>
      <Input
        id="people-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={messages.people.searchPlaceholder}
        autoComplete="off"
        aria-describedby={hintId}
        className="max-w-[480px]"
      />
      {showMinHint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {messages.people.searchMinHint}
        </p>
      ) : null}
    </div>
  );
};
