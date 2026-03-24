"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RecordForm } from "@/components/dashboard/record-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useModelFields } from "@/hooks/use-model-fields";

export default function EditRecordPage() {
  const { model, id } = useParams<{ model: string; id: string }>();
  const {
    model: modelData,
    loading: modelLoading,
    error: modelError,
  } = useModelFields(model);

  const [recordData, setRecordData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [recordLoading, setRecordLoading] = useState(true);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Fetch the record once we have the model
  useEffect(() => {
    if (!modelData) return;

    fetch(`/api/dynamic/${model}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch records");
        const json = await res.json();
        // GET returns { data: [...], meta: {...} }
        const records: Array<Record<string, unknown>> = json.data ?? json;
        const found = records.find((r) => r.id === id);
        if (!found) throw new Error(`Record "${id}" not found`);
        return found;
      })
      .then(setRecordData)
      .catch((e) => setRecordError(e.message))
      .finally(() => setRecordLoading(false));
  }, [model, id, modelData]);

  const loading = modelLoading || recordLoading;
  const error = modelError ?? recordError;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-100 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !modelData || !recordData) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">
          {error ?? "Record not found"}
        </p>
      </div>
    );
  }

  return (
    <RecordForm model={modelData} initialData={recordData} recordId={id} />
  );
}
