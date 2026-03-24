"use client";

import { useCallback, Suspense, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Settings2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useModelFields } from "@/hooks/use-model-fields";
import { useRecords, RecordRow } from "@/hooks/use-records";
import { useTableParams } from "@/hooks/use-table-params";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { useModelPageShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/lib/toast";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { RecordTable } from "@/components/dashboard/record-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { BulkActionBar } from "@/components/dashboard/bulk-action-bar";
import { ShortcutHint } from "@/components/dashboard/shortcut-hint";

function ModelPageInner() {
  const { model } = useParams<{ model: string }>();

  // ── Model + fields ───────────────────────────────────
  const {
    model: modelData,
    loading: modelLoading,
    error: modelError,
  } = useModelFields(model);

  const fieldNames = modelData?.fields.map((f) => f.name) ?? [];

  // ── Column visibility ────────────────────────────────
  const { visibleColumns, toggleColumn, showAll } = useColumnVisibility(
    model,
    fieldNames,
  );

  // ── URL-synced table state ───────────────────────────
  const [tableParams, setTableParams] = useTableParams();
  const { page, limit, sort, dir, search, filters } = tableParams;

  // ── Records ──────────────────────────────────────────
  const {
    records,
    meta,
    loading: recordsLoading,
    deleteRecord,
    refresh,
  } = useRecords({
    modelName: model,
    page,
    limit,
    sort,
    dir,
    search,
    filters,
  });

  // ── Bulk select ──────────────────────────────────────
  const {
    selected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    isSomeSelected,
    count: selectedCount,
  } = useBulkSelect(records.map((r) => r.id));

  // ── Keyboard shortcuts ───────────────────────────────
  useModelPageShortcuts(model);

  // ── Single delete confirm ────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<RecordRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSingleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.id);
      toast.success("Record deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk delete ──────────────────────────────────────
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/dynamic/${model}/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bulk delete failed");
      toast.success(
        `Deleted ${data.deleted} record${data.deleted !== 1 ? "s" : ""}`,
      );
      clear();
      await refresh();
    } catch (e) {
      toast.error(
        "Bulk delete failed",
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── Sort ─────────────────────────────────────────────
  const handleSort = useCallback(
    (fieldName: string) => {
      if (sort === fieldName)
        setTableParams({ dir: dir === "asc" ? "desc" : "asc" });
      else setTableParams({ sort: fieldName, dir: "asc" });
    },
    [sort, dir, setTableParams],
  );

  const hasActiveFilters = !!search || Object.values(filters).some(Boolean);

  // ── Loading / error ──────────────────────────────────
  if (modelLoading) {
    return (
      <div className="p-4 md:p-8 space-y-5 min-w-full max-w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 max-w-sm rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md ml-auto" />
        </div>
        <TableSkeleton columns={4} rows={8} />
      </div>
    );
  }

  if (modelError || !modelData) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-destructive">
          {modelError ?? "Model not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-full">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-medium tracking-tight truncate">
            {modelData.label}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-xs font-mono text-muted-foreground">
              {modelData.name}
            </span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground hidden sm:inline tabular-nums">
              {meta
                ? `${meta.total.toLocaleString()} record${meta.total !== 1 ? "s" : ""}`
                : "…"}
            </span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {modelData.fields.length} field
              {modelData.fields.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/${model}/api`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API</span>
            </Button>
          </Link>
          <Link href={`/dashboard/${model}/fields`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fields</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {modelData.fields.length}
              </span>
            </Button>
          </Link>

          <Link href={`/dashboard/${model}/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New record</span>
              <span className="sm:hidden">New</span>
              <ShortcutHint keys={["N"]} className="ml-0.5 my-0.5" size="20" />
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="my-5" />

      {modelData.fields.length === 0 ? (
        <EmptyState
          variant="no-fields"
          modelName={model}
          modelLabel={modelData.label}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TableToolbar
            fields={modelData.fields}
            search={search}
            onSearchChange={(v) => setTableParams({ search: v })}
            filters={filters}
            onFilterChange={(field, value) =>
              setTableParams({ filters: { ...filters, [field]: value } })
            }
            onClearFilters={() => setTableParams({ filters: {}, search: "" })}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onShowAllColumns={showAll}
          />

          <RecordTable
            modelName={model}
            modelLabel={modelData.label}
            fields={modelData.fields}
            records={records}
            meta={meta}
            loading={recordsLoading}
            sort={sort}
            dir={dir}
            visibleColumns={visibleColumns}
            hasActiveFilters={hasActiveFilters}
            selectedIds={selected}
            isAllSelected={isAllSelected}
            isSomeSelected={isSomeSelected}
            onToggleSelect={toggle}
            onToggleSelectAll={toggleAll}
            onSort={handleSort}
            onPageChange={(p) => setTableParams({ page: p })}
            onLimitChange={(l) => setTableParams({ limit: l, page: 1 })}
            onDelete={setDeleteTarget}
            onClearFilters={() => setTableParams({ filters: {}, search: "" })}
          />
        </div>
      )}

      {/* Single delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              Record{" "}
              <span className="font-mono text-xs">{deleteTarget?.id}</span> will
              be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleSingleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedCount}
        onDelete={handleBulkDelete}
        onClear={clear}
        deleting={bulkDeleting}
      />
    </div>
  );
}

export default function ModelPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-8 space-y-4 max-w-6xl">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <TableSkeleton columns={4} rows={8} />
        </div>
      }
    >
      <ModelPageInner />
    </Suspense>
  );
}
