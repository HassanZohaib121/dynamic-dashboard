// components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, Database, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelSummary } from "@/hooks/use-models";
import { CreateModelDialog } from "./create-model-dialog";

interface SidebarProps {
  models: ModelSummary[];
  loading: boolean;
  onModelCreated: () => void;
}

export function Sidebar({ models, loading, onModelCreated }: SidebarProps) {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex flex-col w-[220px] min-h-screen shrink-0 border-r border-border bg-muted/30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-foreground">
            <Database className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="text-sm font-medium tracking-tight">DataBase</span>
        </div>

        {/* Section label */}
        <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Models
        </p>

        {/* Nav */}
        <ScrollArea className="flex-1 px-2">
          <nav className="flex flex-col gap-0.5 pb-2">
            {loading ? (
              <>
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-[80%] rounded-md" />
                <Skeleton className="h-8 w-[65%] rounded-md" />
              </>
            ) : models.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No models yet
              </p>
            ) : (
              models.map((m) => {
                const href = `/dashboard/${m.name}`;
                const active = pathname === href;
                return (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                          active
                            ? "bg-background text-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                        )}
                      >
                        <Circle
                          className={cn(
                            "w-1.5 h-1.5 shrink-0 fill-current",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground/50",
                          )}
                        />
                        <span className="flex-1 truncate">{m.label}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 font-normal tabular-nums"
                        >
                          {m._count.records}
                        </Badge>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-mono text-xs">
                      {m.name}
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </nav>
        </ScrollArea>

        {/* Create button */}
        <div className="p-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New model
          </Button>
        </div>
      </aside>

      <CreateModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          onModelCreated();
        }}
      />
    </TooltipProvider>
  );
}
