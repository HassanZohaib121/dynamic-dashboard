import { useState, useEffect, useCallback, useRef } from "react";

export interface RecordRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface RecordMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
  sort: string;
  dir: "asc" | "desc";
}

export type RecordFilters = Record<string, string>;

export interface UseRecordsOptions {
  modelName: string;
  page?: number;
  limit?: number;
  sort?: string;
  dir?: "asc" | "desc";
  search?: string;
  filters?: RecordFilters;
}

export function useRecords(options: UseRecordsOptions) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [meta, setMeta]       = useState<RecordMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    modelName,
    page    = 1,
    limit   = 50,
    sort    = "createdAt",
    dir     = "desc",
    search  = "",
    filters = {},
  } = options;

  const filtersKey = JSON.stringify(filters);

  const fetch_ = useCallback(async () => {
    if (!modelName) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        sort,
        dir,
        ...(search && { search }),
      });
      const parsedFilters: RecordFilters = JSON.parse(filtersKey);
      for (const [key, val] of Object.entries(parsedFilters)) {
        if (val !== "") params.set(`filter[${key}]`, val);
      }
      const res = await fetch(`/api/dynamic/${modelName}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const json = await res.json();
      setRecords(json.data ?? json);
      setMeta(json.meta ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [modelName, page, limit, sort, dir, search, filtersKey]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(fetch_, search ? 300 : 0);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetch_, search]);

  // Optimistic delete — removes from UI immediately, rolls back on failure
  const deleteRecord = useCallback(async (id: string): Promise<void> => {
    const previousRecords = records;
    const previousMeta    = meta;

    setRecords((prev) => prev.filter((r) => r.id !== id));
    setMeta((m) => m ? { ...m, total: m.total - 1, count: m.count - 1 } : m);

    try {
      const res = await fetch(`/api/dynamic/${modelName}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetch_(); // resync accurate totals
    } catch (e) {
      setRecords(previousRecords);
      setMeta(previousMeta);
      throw e;
    }
  }, [records, meta, modelName, fetch_]);

  return { records, meta, loading, error, refresh: fetch_, deleteRecord };
}