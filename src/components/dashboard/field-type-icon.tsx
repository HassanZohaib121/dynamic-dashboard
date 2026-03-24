import {
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  ChevronDown,
  List,
  Braces,
} from "lucide-react";
import { FieldType } from "@/hooks/use-fields";
import { cn } from "@/lib/utils";

interface FieldTypeIconProps {
  type: FieldType;
  className?: string;
}

const ICONS: Record<FieldType, React.ElementType> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  BOOLEAN: ToggleLeft,
  SELECT: ChevronDown,
  MULTI_SELECT: List,
  JSON: Braces,
};

const COLORS: Record<FieldType, string> = {
  TEXT: "text-blue-500",
  NUMBER: "text-amber-500",
  DATE: "text-violet-500",
  BOOLEAN: "text-emerald-500",
  SELECT: "text-rose-500",
  MULTI_SELECT: "text-orange-500",
  JSON: "text-slate-500",
};

export function FieldTypeIcon({ type, className }: FieldTypeIconProps) {
  const Icon = ICONS[type] ?? Type;
  return <Icon className={cn("w-3.5 h-3.5", COLORS[type], className)} />;
}

export { COLORS as FIELD_TYPE_COLORS };
