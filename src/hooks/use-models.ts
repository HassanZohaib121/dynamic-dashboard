import { useState, useEffect, useCallback } from "react";

export interface ModelSummary {
  id: string;
  name: string;
  label: string;
  createdAt: string;
  _count: { fields: number; records: number };
}

interface UseModelsReturn {
  models: ModelSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createModel: (name: string, label: string) => Promise<ModelSummary>;
  deleteModel: (id: string) => Promise<void>;
  renameModel: (id: string, label: string) => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels]   = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      setModels(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createModel = async (name: string, label: string): Promise<ModelSummary> => {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, label }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create model");
    await refresh();
    return data;
  };

  const deleteModel = async (id: string): Promise<void> => {
    const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to delete model");
    }
    await refresh();
  };

  const renameModel = async (id: string, label: string): Promise<void> => {
    const res = await fetch(`/api/models/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to rename model");
    await refresh();
  };

  return { models, loading, error, refresh, createModel, deleteModel, renameModel };
}