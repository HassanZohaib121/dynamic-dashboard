// hooks/use-column-visibility.ts
import { useState } from "react";

const STORAGE_KEY = (modelName: string) => `db_columns_${modelName}`;

function readFromStorage(modelName: string, fieldNames: string[]): Set<string> {
  if (typeof window === "undefined" || fieldNames.length === 0) {
    return new Set(fieldNames);
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY(modelName));
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      const valid = parsed.filter((n) => fieldNames.includes(n));
      if (valid.length > 0) return new Set(valid);
    }
  } catch {}
  return new Set(fieldNames);
}

export function useColumnVisibility(modelName: string, fieldNames: string[]) {
  // Stored preference: null = "not yet loaded", Set = user's choice
  const [stored, setStored] = useState<Set<string> | null>(null);

  // Derive visible columns without any effect or ref:
  // - If fields haven't loaded yet → empty set (table hasn't rendered anyway)
  // - If user has made a selection → intersect with current fields (handles field deletion)
  // - Otherwise → read localStorage once, fall back to all-visible
  const visibleColumns: Set<string> =
    fieldNames.length === 0
      ? new Set()
      : stored !== null
      ? new Set(fieldNames.filter((n) => stored.has(n)))
      : readFromStorage(modelName, fieldNames);

  const toggleColumn = (name: string) => {
    setStored((prev) => {
      const base = prev ?? visibleColumns;
      if (base.size === 1 && base.has(name)) return base; // keep ≥1

      const next = new Set(base);
      if(next.has(name)){
        next.delete(name)
      } else {
        next.add(name)
      }
      // next.has(name) ? next.delete(name) : next.add(name);

      try {
        localStorage.setItem(STORAGE_KEY(modelName), JSON.stringify([...next]));
      } catch {}

      return next;
    });
  };

  const showAll = () => {
    setStored(new Set(fieldNames));
    try {
      localStorage.removeItem(STORAGE_KEY(modelName));
    } catch {}
  };

  return { visibleColumns, toggleColumn, showAll };
}