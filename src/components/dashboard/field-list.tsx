"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldTypeIcon } from "./field-type-icon";
import { Field } from "@/hooks/use-fields";
import { cn } from "@/lib/utils";

// ─── Single sortable row ────────────────────────────────
interface FieldRowProps {
  field: Field;
  onEdit: (field: Field) => void;
  onDelete: (field: Field) => void;
}

function FieldRow({ field, onEdit, onDelete }: FieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 bg-card border-b border-border last:border-b-0 transition-shadow",
        isDragging && "shadow-lg z-10 opacity-90 rounded-lg",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Type icon */}
      <div className="shrink-0">
        <FieldTypeIcon type={field.type} className="w-4 h-4" />
      </div>

      {/* Label + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{field.label}</span>
          {field.required && (
            <span className="text-destructive text-xs leading-none">*</span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {field.name}
        </span>
      </div>

      {/* Type badge */}
      <span className="hidden sm:inline-flex shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
        {field.type.replace("_", " ")}
      </span>

      {/* Constraint badges */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        {field.required && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 h-4 font-normal"
          >
            required
          </Badge>
        )}
        {field.unique && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 h-4 font-normal"
          >
            unique
          </Badge>
        )}
      </div>

      {/* Options count for SELECT types */}
      {(field.type === "SELECT" || field.type === "MULTI_SELECT") &&
        field.options && (
          <span className="hidden lg:block text-xs text-muted-foreground shrink-0">
            {field.options.length} option{field.options.length !== 1 ? "s" : ""}
          </span>
        )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(field)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(field)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Field list with DnD ────────────────────────────────
interface FieldListProps {
  fields: Field[];
  onEdit: (field: Field) => void;
  onReorder: (fields: Field[]) => void;
  onDelete: (field: Field) => Promise<void>;
}

export function FieldList({
  fields,
  onEdit,
  onReorder,
  onDelete,
}: FieldListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    onReorder(reordered);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No fields yet
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first field using the button above.
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="rounded-xl border border-border overflow-hidden">
            {fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                onEdit={onEdit}
                onDelete={(f) => setDeleteTarget(f)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete field &ldquo;{deleteTarget?.label}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the field definition. Existing record
              data stored under{" "}
              <span className="font-mono text-xs">{deleteTarget?.name}</span>{" "}
              will be orphaned but not deleted from records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete field"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
