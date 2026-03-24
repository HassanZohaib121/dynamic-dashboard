import { useState, useEffect, useCallback } from "react";

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "JSON";
  required: boolean;
  unique: boolean;
  defaultValue: string | null;
  options: string[] | null;
  order: number;
}

export interface ModelWithFields {
  id: string;
  name: string;
  label: string;
  fields: FieldDefinition[];
}

export function useModelFields(modelName: string) {
  const [model, setModel]     = useState<ModelWithFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listRes = await fetch("/api/models");
      if (!listRes.ok) throw new Error("Failed to fetch models");
      const all: ModelWithFields[] = await listRes.json();
      const found = all.find((m) => m.name === modelName);
      if (!found) throw new Error(`Model "${modelName}" not found`);

      const detailRes = await fetch(`/api/models/${found.id}`);
      if (!detailRes.ok) throw new Error("Failed to fetch model details");
      const detail: ModelWithFields = await detailRes.json();
      setModel(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [modelName]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { model, loading, error, refresh: fetch_ };
}