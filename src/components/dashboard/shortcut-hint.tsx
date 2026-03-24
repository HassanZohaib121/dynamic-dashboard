import { cn } from "@/lib/utils";

interface ShortcutHintProps {
  keys: string[];
  className?: string;
  size?: string;
}

export function ShortcutHint({ keys, className, size }: ShortcutHintProps) {
  return (
    <span
      className={cn("hidden lg:inline-flex items-center gap-0.5", className)}
    >
      {keys.map((k, i) => (
        <kbd
          key={i}
          className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[${size}px] font-medium bg-muted border border-border rounded text-muted-foreground leading-none`}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
