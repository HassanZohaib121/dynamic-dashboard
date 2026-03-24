"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { RecordFilters } from "./use-records";

export interface TableParams {
  page: number;
  limit: number;
  sort: string;
  dir: "asc" | "desc";
  search: string;
  filters: RecordFilters;
}

export function useTableParams(): [TableParams, (patch: Partial<TableParams>) => void] {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Read current params
  const params: TableParams = {
    page:   Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10)),
    limit:  Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))),
    sort:   searchParams.get("sort")  ?? "createdAt",
    dir:   (searchParams.get("dir")  ?? "desc") as "asc" | "desc",
    search: searchParams.get("search") ?? "",
    filters: (() => {
      const out: RecordFilters = {};
      for (const [key, val] of searchParams.entries()) {
        const match = key.match(/^f\[(.+)\]$/);
        if (match) out[match[1]] = val;
      }
      return out;
    })(),
  };

  const setParams = useCallback(
    (patch: Partial<TableParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...params, ...patch };

      // Reset to page 1 on any change except explicit page change
      if (!("page" in patch)) merged.page = 1;

      // Write primitives
      next.set("page",  String(merged.page));
      next.set("limit", String(merged.limit));
      next.set("sort",  merged.sort);
      next.set("dir",   merged.dir);

      if (merged.search) next.set("search", merged.search);
      else next.delete("search");

      // Remove all old filters then write new ones
      for (const key of [...next.keys()]) {
        if (key.startsWith("f[")) next.delete(key);
      }
      for (const [field, val] of Object.entries(merged.filters)) {
        if (val) next.set(`f[${field}]`, val);
      }

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), pathname]
  );

  return [params, setParams];
}