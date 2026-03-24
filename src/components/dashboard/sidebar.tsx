"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, Circle, Menu, LayoutGrid } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModelSummary } from "@/hooks/use-models";
import { CreateModelDialog } from "./create-model-dialog";
import { ThemeToggle } from "../theme-toggle";
import { UserMenu } from "./user-menu";

interface SidebarProps {
  models: ModelSummary[];
  loading: boolean;
  onModelCreated: () => void;
}

function NavContent({
  models,
  loading,
  onCreateClick,
}: {
  models: ModelSummary[];
  loading: boolean;
  onCreateClick: () => void;
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-4 py-4 border-b border-border shrink-0"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded">
            <LayoutGrid className="w-6 h-6" />
          </div>

          <span className="text-md font-medium tracking-tight">
            Dashboard Hub
          </span>
        </Link>

        {/* Section label */}
        <Button
          variant="outline"
          size="sm"
          className="flex justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onCreateClick}
        >
          <Plus className="w-3.5 h-3.5" />
          New model
        </Button>
        <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
          Models
        </p>

        {/* Nav list */}
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
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
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

        {/* Footer: create button + theme toggle */}
        <div className="p-2 border-t border-border flex items-center gap-1">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </TooltipProvider>
  );
}

export function Sidebar({ models, loading, onModelCreated }: SidebarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-55 min-h-screen shrink-0 border-r border-border bg-muted/30">
        <NavContent
          models={models}
          loading={loading}
          onCreateClick={() => setDialogOpen(true)}
        />
      </aside>

      {/* ── Mobile: hamburger + sheet ────────────────────── */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="w-9 h-9 shadow-sm">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-55">
            <NavContent
              models={models}
              loading={loading}
              onCreateClick={() => {
                setSheetOpen(false);
                setDialogOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <CreateModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          onModelCreated();
        }}
      />
    </>
  );
}
