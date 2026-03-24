import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 4, rows = 8 }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3 rounded"
            style={{ width: `${60 + (i % 3) * 20}px` }}
          />
        ))}
        <Skeleton className="h-3 w-14 ml-auto rounded" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0"
          style={{ opacity: 1 - row * 0.08 }}
        >
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className="h-4 rounded"
              style={{ width: `${50 + ((row + col) % 4) * 25}px` }}
            />
          ))}
          <div className="ml-auto flex gap-1.5">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      ))}

      {/* Pagination area */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}
