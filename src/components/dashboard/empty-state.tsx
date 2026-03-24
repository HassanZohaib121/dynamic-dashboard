import Link from "next/link";
import { Plus, Settings2, SearchX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  variant: "no-fields" | "no-records" | "no-results";
  modelName: string;
  modelLabel: string;
  onClearFilters?: () => void;
}

const CONFIG = {
  "no-fields": {
    Icon: Settings2,
    title: "No fields defined",
    description: "Add fields to this model before creating records.",
    cta: null,
  },
  "no-records": {
    Icon: Inbox,
    title: "No records yet",
    description: null,
    cta: null,
  },
  "no-results": {
    Icon: SearchX,
    title: "No results found",
    description: "Try adjusting your search or clearing your filters.",
    cta: null,
  },
} as const;

export function EmptyState({
  variant,
  modelName,
  modelLabel,
  onClearFilters,
}: EmptyStateProps) {
  const { Icon, title, description } = CONFIG[variant];

  return (
    <div className="rounded-xl border border-dashed border-border py-16 flex flex-col items-center gap-3 text-center">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-xs">
            {description}
          </p>
        )}
        {variant === "no-records" && (
          <p className="text-xs text-muted-foreground">
            Create the first record in{" "}
            <span className="font-medium">{modelLabel}</span>.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {variant === "no-fields" && (
          <Link href={`/dashboard/${modelName}/fields`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              Add fields
            </Button>
          </Link>
        )}
        {variant === "no-records" && (
          <Link href={`/dashboard/${modelName}/new`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New record
            </Button>
          </Link>
        )}
        {variant === "no-results" && onClearFilters && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClearFilters}
            className="gap-1.5"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
