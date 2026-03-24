"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReindexButtonProps {
  modelId: string;
  modelLabel: string;
}

export function ReindexButton({ modelId, modelLabel }: ReindexButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReindex = async () => {
    setLoading(true);
    const toastId = toast.loading(`Reindexing ${modelLabel}…`);
    try {
      const res = await fetch(`/api/models/${modelId}/reindex`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reindex failed");
      toast.dismiss(toastId as string);
      toast.success(
        "Reindex complete",
        `${data.indexed} record${data.indexed !== 1 ? "s" : ""} indexed`,
      );
    } catch (e) {
      toast.dismiss(toastId as string);
      toast.error(
        "Reindex failed",
        e instanceof Error ? e.message : "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleReindex}
            disabled={loading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Indexing…" : "Reindex"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-50 text-center">
          Rebuilds the search index for all records in this model
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
