"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useFields, Field } from "@/hooks/use-fields";
import { FieldList } from "@/components/dashboard/field-list";
import { AddFieldSheet } from "@/components/dashboard/add-field-sheet";
import { EditFieldSheet } from "@/components/dashboard/edit-field-sheet";
import { ReindexButton } from "@/components/dashboard/reindex-button";

interface ModelMeta {
  id: string;
  name: string;
  label: string;
}

export default function FieldsPage() {
  const { model: modelName } = useParams<{ model: string }>();

  const [modelMeta, setModelMeta] = useState<ModelMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((all: ModelMeta[]) =>
        setModelMeta(all.find((m) => m.name === modelName) ?? null),
      )
      .finally(() => setMetaLoading(false));
  }, [modelName]);

  const {
    fields,
    loading: fieldsLoading,
    error,
    createField,
    updateField,
    deleteField,
    reorderFields,
  } = useFields(modelMeta?.id ?? null);

  const loading = metaLoading || fieldsLoading;
  const backUrl = `/dashboard/${modelName}`;

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href={backUrl}
              className="hover:text-foreground transition-colors truncate"
            >
              {modelMeta?.label ?? modelName}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Fields</span>
          </div>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-muted-foreground" />
            Field builder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : `${fields.length} field${fields.length !== 1 ? "s" : ""} · drag to reorder`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reindex button — only shown when there are fields */}
          {!loading && modelMeta && fields.length > 0 && (
            <ReindexButton
              modelId={modelMeta.id}
              modelLabel={modelMeta.label}
            />
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
            disabled={loading || !!modelMeta ? false : true}
          >
            <Plus className="w-3.5 h-3.5" />
            Add field
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <FieldList
          fields={fields}
          onEdit={setEditField}
          onReorder={reorderFields}
          onDelete={deleteField}
        />
      )}

      {/* Field type legend */}
      {!loading && fields.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {Array.from(new Set(fields.map((f) => f.type))).map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="text-[10px] gap-1.5 px-2"
            >
              {type.replace("_", " ")}
              <span className="text-muted-foreground">
                ×{fields.filter((f) => f.type === type).length}
              </span>
            </Badge>
          ))}
        </div>
      )}

      <AddFieldSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={createField}
      />
      <EditFieldSheet
        field={editField}
        onOpenChange={(open) => !open && setEditField(null)}
        onSubmit={updateField}
      />
    </div>
  );
}
