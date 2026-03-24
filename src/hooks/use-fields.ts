import { useState, useEffect, useCallback } from "react";

export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | "JSON";

export interface Field {
  id: string;
  modelId: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue: string | null;
  options: string[] | null;
  order: number;
  createdAt: string;
}

export interface CreateFieldInput {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  options?: string[];
}

export interface UpdateFieldInput {
  label?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string | null;
  options?: string[];
}

export function useFields(modelId: string | null) {
  const [fields, setFields]   = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/models/${modelId}/fields`);
      if (!res.ok) throw new Error("Failed to fetch fields");
      const data: Field[] = await res.json();
      setFields(data.sort((a, b) => a.order - b.order));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createField = async (input: CreateFieldInput): Promise<Field> => {
    const res = await fetch(`/api/models/${modelId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create field");
    await refresh();
    return data;
  };

  const updateField = async (fieldId: string, input: UpdateFieldInput): Promise<Field> => {
    const res = await fetch(`/api/models/${modelId}/fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update field");
    await refresh();
    return data;
  };

  const deleteField = async (field: Field): Promise<void> => {
    console.log(field.id)
    const res = await fetch(`/api/models/${modelId}/fields/${field.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to delete field");
    }
    await refresh();
  };

  // Optimistic reorder: update local state immediately, then persist
  const reorderFields = async (newOrder: Field[]): Promise<void> => {
    setFields(newOrder);
    try {
      const res = await fetch(`/api/models/${modelId}/fields/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((f) => f.id) }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    } catch {
      // Rollback on failure
      await refresh();
    }
  };

  return {
    fields,
    loading,
    error,
    refresh,
    createField,
    updateField,
    deleteField,
    reorderFields,
  };
}