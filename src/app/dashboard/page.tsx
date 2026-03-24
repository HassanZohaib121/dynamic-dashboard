"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, Layers } from "lucide-react";
import { useModels, ModelSummary } from "@/hooks/use-models";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import { CreateModelDialog } from "@/components/dashboard/create-model-dialog";

export default function DashboardHome() {
  const { models, loading, error, refresh, deleteModel } = useModels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModel, setConfirmModel] = useState<ModelSummary | null>(null);

  const handleDelete = async () => {
    if (!confirmModel) return;
    setDeletingId(confirmModel.id);
    try {
      await deleteModel(confirmModel.id);
    } finally {
      setDeletingId(null);
      setConfirmModel(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Models</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : `${models.length} model${models.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New model
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive mb-4">
          Failed to load models: {error}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-35 rounded-xl" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-12">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <Layers className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No models yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first model to start storing data.
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New model
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((m) => (
            <Card
              key={m.id}
              className="group relative flex flex-col hover:shadow-sm transition-shadow"
            >
              <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                {/* Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                  {m.label[0]?.toUpperCase()}
                </div>

                {/* Delete — visible on hover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmModel(m)}
                  disabled={deletingId === m.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <Link
                  href={`/dashboard/${m.name}`}
                  className="block group/link"
                >
                  <p className="text-sm font-medium leading-none mb-1 group-hover/link:underline underline-offset-2">
                    {m.label}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {m.name}
                  </p>
                </Link>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium tabular-nums">
                      {m._count.records}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      records
                    </span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium tabular-nums">
                      {m._count.fields}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      fields
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/${m.name}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex flex-col items-center justify-center gap-2 h-35 rounded-xl border border-dashed border-border text-muted-foreground hover:border-border/80 hover:bg-muted/30 hover:text-foreground transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">New model</span>
          </button>
        </div>
      )}

      {/* Create dialog */}
      <CreateModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          refresh();
        }}
      />

      {/* Confirm delete */}
      <AlertDialog
        open={!!confirmModel}
        onOpenChange={(open) => !open && setConfirmModel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{confirmModel?.label}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the model and all{" "}
              <strong>{confirmModel?._count.records}</strong> records. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
