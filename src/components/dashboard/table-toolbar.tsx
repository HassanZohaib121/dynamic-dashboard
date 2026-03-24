"use client";

import { Search, SlidersHorizontal, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldDefinition } from "@/hooks/use-model-fields";
import { RecordFilters } from "@/hooks/use-records";
import { FieldTypeIcon } from "./field-type-icon";

interface TableToolbarProps {
  fields: FieldDefinition[];
  search: string;
  onSearchChange: (v: string) => void;
  filters: RecordFilters;
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  visibleColumns: Set<string>;
  onToggleColumn: (name: string) => void;
  onShowAllColumns: () => void;
}

const FILTERABLE_TYPES = [
  "TEXT",
  "SELECT",
  "MULTI_SELECT",
  "BOOLEAN",
  "NUMBER",
];

export function TableToolbar({
  fields,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  visibleColumns,
  onToggleColumn,
  onShowAllColumns,
}: TableToolbarProps) {
  const filterableFields = fields.filter((f) =>
    FILTERABLE_TYPES.includes(f.type),
  );
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-50 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search records…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
        {search && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange("")}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filters popover */}
      {filterableFields.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 h-4 font-normal"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Filters</p>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={onClearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {filterableFields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <FieldTypeIcon type={field.type} className="w-3 h-3" />
                    {field.label}
                  </Label>

                  {field.type === "BOOLEAN" ? (
                    <Select
                      value={filters[field.name] ?? "__any__"}
                      onValueChange={(v) =>
                        onFilterChange(field.name, v === "__any__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">Any</SelectItem>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : field.type === "SELECT" ||
                    field.type === "MULTI_SELECT" ? (
                    <Select
                      value={filters[field.name] ?? "__any__"}
                      onValueChange={(v) =>
                        onFilterChange(field.name, v === "__any__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">Any</SelectItem>
                        {(field.options ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="h-7 text-xs"
                      placeholder={`Filter by ${field.label.toLowerCase()}…`}
                      value={filters[field.name] ?? ""}
                      onChange={(e) =>
                        onFilterChange(field.name, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 ml-auto">
            <Eye className="w-3.5 h-3.5" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">
            Toggle columns
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {fields.some((f) => !visibleColumns.has(f.name)) && (
            <>
              <DropdownMenuItem
                className="text-xs text-muted-foreground"
                onClick={onShowAllColumns}
              >
                Show all columns
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {fields.map((field) => (
            <DropdownMenuCheckboxItem
              key={field.id}
              className="text-sm"
              checked={visibleColumns.has(field.name)}
              onCheckedChange={() => onToggleColumn(field.name)}
            >
              <span className="flex items-center gap-2">
                <FieldTypeIcon type={field.type} className="w-3 h-3" />
                {field.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="w-full flex flex-wrap gap-1.5 mt-1">
          {Object.entries(filters)
            .filter(([, v]) => v)
            .map(([key, val]) => {
              const field = fields.find((f) => f.name === key);
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 pl-2 pr-1 text-xs h-5"
                >
                  <span className="text-muted-foreground">
                    {field?.label ?? key}:
                  </span>{" "}
                  {val}
                  <button
                    onClick={() => onFilterChange(key, "")}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
        </div>
      )}
    </div>
  );
}
