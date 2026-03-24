"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  deleting: boolean;
}

export function BulkActionBar({
  count,
  onDelete,
  onClear,
  deleting,
}: BulkActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-2.5",
        "bg-foreground text-background rounded-xl shadow-lg",
        "transition-all duration-200",
        count > 0
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <span className="text-sm font-medium tabular-nums">{count} selected</span>

      <div className="w-px h-4 bg-background/20" />

      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 text-background hover:bg-background/10 hover:text-background"
        onClick={onDelete}
        disabled={deleting}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {deleting ? "Deleting…" : "Delete selected"}
      </Button>

      <button
        onClick={onClear}
        className="text-background/60 hover:text-background transition-colors ml-1"
        aria-label="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
