"use client";

import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldDefinition } from "@/hooks/use-model-fields";
import { RecordRow, RecordMeta } from "@/hooks/use-records";
import { TableSkeleton } from "./table-skeleton";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

// ─── Cell renderer ──────────────────────────────────────
function CellValue({ value, type }: { value: unknown; type: string }) {
  if (value === null || value === undefined || value === "")
    return <span className="text-muted-foreground/30 select-none">—</span>;

  switch (type) {
    case "BOOLEAN":
      return (
        <Badge
          variant={value ? "default" : "secondary"}
          className="text-[10px] px-1.5 h-4 font-normal"
        >
          {value ? "true" : "false"}
        </Badge>
      );
    case "DATE":
      return (
        <span className="text-sm tabular-nums text-muted-foreground">
          {new Date(value as string).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    case "SELECT":
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {String(value)}
        </Badge>
      );
    case "MULTI_SELECT": {
      const arr = Array.isArray(value) ? (value as string[]) : [String(value)];
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((v) => (
            <Badge key={v} variant="outline" className="text-xs font-normal">
              {v}
            </Badge>
          ))}
        </div>
      );
    }
    case "JSON":
      return (
        <code className="text-xs text-muted-foreground font-mono truncate max-w-40 block">
          {JSON.stringify(value)}
        </code>
      );
    case "NUMBER":
      return (
        <span className="text-sm tabular-nums font-medium">
          {Number(value).toLocaleString()}
        </span>
      );
    default:
      return (
        <span className="text-sm truncate max-w-50 block" title={String(value)}>
          {String(value)}
        </span>
      );
  }
}

// ─── Sort header ────────────────────────────────────────
const SORTABLE_TYPES = ["TEXT", "NUMBER", "DATE", "BOOLEAN"];

function SortHeader({
  field,
  sort,
  dir,
  onSort,
}: {
  field: FieldDefinition;
  sort: string;
  dir: "asc" | "desc";
  onSort: (n: string) => void;
}) {
  const active = sort === field.name;
  const sortable = SORTABLE_TYPES.includes(field.type);
  if (!sortable)
    return (
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label}
      </span>
    );

  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(field.name)}
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors group",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {field.label}
      <Icon
        className={cn(
          "w-3 h-3 transition-opacity",
          active ? "opacity-100" : "opacity-40 group-hover:opacity-70",
        )}
      />
    </button>
  );
}

// ─── Pagination bar ─────────────────────────────────────
function PaginationBar({
  meta,
  onPageChange,
  onLimitChange,
}: {
  meta: RecordMeta;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const { page, totalPages, total, limit, count } = meta;
  const start = (page - 1) * limit + 1;
  const end = Math.min(start + count - 1, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
      <p className="text-xs text-muted-foreground tabular-nums">
        {total === 0
          ? "No records"
          : `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Rows
          </span>
          <Select
            value={String(limit)}
            onValueChange={(v) => onLimitChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 tabular-nums min-w-14 text-center">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main RecordTable ───────────────────────────────────
interface RecordTableProps {
  modelName: string;
  modelLabel: string;
  fields: FieldDefinition[];
  records: RecordRow[];
  meta: RecordMeta | null;
  loading: boolean;
  sort: string;
  dir: "asc" | "desc";
  visibleColumns: Set<string>;
  hasActiveFilters: boolean;
  // Bulk select
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  // Handlers
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onDelete: (record: RecordRow) => void;
  onClearFilters: () => void;
}

export function RecordTable({
  modelName,
  modelLabel,
  fields,
  records,
  meta,
  loading,
  sort,
  dir,
  visibleColumns,
  hasActiveFilters,
  selectedIds,
  isAllSelected,
  isSomeSelected,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onPageChange,
  onLimitChange,
  onDelete,
  onClearFilters,
}: RecordTableProps) {
  const visibleFields = fields.filter((f) => visibleColumns.has(f.name));

  if (loading) return <TableSkeleton columns={visibleFields.length} rows={8} />;

  if (records.length === 0) {
    return (
      <EmptyState
        variant={hasActiveFilters ? "no-results" : "no-records"}
        modelName={modelName}
        modelLabel={modelLabel}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {/* Bulk select header checkbox */}
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={isAllSelected}
                    data-state={isSomeSelected ? "indeterminate" : undefined}
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Select all"
                    className="translate-y-px"
                  />
                </TableHead>

                {visibleFields.map((field) => (
                  <TableHead key={field.id} className="whitespace-nowrap">
                    <SortHeader
                      field={field}
                      sort={sort}
                      dir={dir}
                      onSort={onSort}
                    />
                  </TableHead>
                ))}

                <TableHead className="w-20 text-right sticky right-0 bg-muted/40">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {records.map((record) => {
                const isSelected = selectedIds.has(record.id);
                return (
                  <TableRow
                    key={record.id}
                    className={cn("group", isSelected && "bg-muted/30")}
                  >
                    <TableCell className="w-10 px-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(record.id)}
                        aria-label="Select row"
                        className="translate-y-px"
                      />
                    </TableCell>

                    {visibleFields.map((field) => (
                      <TableCell key={field.id} className="max-w-55">
                        <CellValue
                          value={record[field.name]}
                          type={field.type}
                        />
                      </TableCell>
                    ))}

                    <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/dashboard/${modelName}/${record.id}/edit`}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            Edit
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(record)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            Delete
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <PaginationBar
            meta={meta}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
