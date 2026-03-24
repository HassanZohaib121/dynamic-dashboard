"use client";

import { useParams } from "next/navigation";
import { RecordForm } from "@/components/dashboard/record-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useModelFields } from "@/hooks/use-model-fields";

export default function NewRecordPage() {
  const { model } = useParams<{ model: string }>();
  const { model: modelData, loading, error } = useModelFields(model);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-100 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !modelData) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">{error ?? "Model not found"}</p>
      </div>
    );
  }

  return <RecordForm model={modelData} />;
}
