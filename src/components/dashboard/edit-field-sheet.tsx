"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FieldTypeIcon } from "./field-type-icon";
import { Field, UpdateFieldInput } from "@/hooks/use-fields";

interface EditFieldSheetProps {
  field: Field | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (fieldId: string, input: UpdateFieldInput) => Promise<Field>;
}

export function EditFieldSheet({
  field,
  onOpenChange,
  onSubmit,
}: EditFieldSheetProps) {
  const open = !!field;

  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [unique, setUnique] = useState(false);
  const [defaultValue, setDefault] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsOptions =
    field?.type === "SELECT" || field?.type === "MULTI_SELECT";

  // Sync state when field changes
  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setRequired(field.required);
      setUnique(field.unique);
      setDefault(field.defaultValue ?? "");
      setOptions(field.options ?? []);
      setError(null);
    }
  }, [field]);

  const addOption = () => {
    const val = optionInput.trim();
    if (!val || options.includes(val)) return;
    setOptions((prev) => [...prev, val]);
    setOptionInput("");
  };

  const removeOption = (opt: string) =>
    setOptions((prev) => prev.filter((o) => o !== opt));

  const handleSubmit = async () => {
    if (!field) return;
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (needsOptions && options.length === 0) {
      setError("At least one option is required");
      return;
    }

    const input: UpdateFieldInput = {
      label: label.trim(),
      required,
      unique,
      defaultValue: defaultValue.trim() || null,
      ...(needsOptions && { options }),
    };

    setLoading(true);
    try {
      await onSubmit(field.id, input);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-105 sm:w-105 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            {field && <FieldTypeIcon type={field.type} className="w-4 h-4" />}
            <SheetTitle className="text-base">Edit field</SheetTitle>
          </div>
          {field && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {field.name}
              <span className="ml-2 text-[10px] uppercase tracking-wider">
                {field.type.replace("_", " ")}
              </span>
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Label (editable) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-label">Label</Label>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          {/* Name — read-only */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <Label>Name</Label>
              <span className="text-xs text-muted-foreground">immutable</span>
            </div>
            <Input
              value={field?.name ?? ""}
              disabled
              className="font-mono text-sm opacity-60"
            />
          </div>

          <Separator />

          {/* Options */}
          {needsOptions && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an option…"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={!optionInput.trim()}
                    className="shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {options.map((opt) => (
                      <Badge
                        key={opt}
                        variant="secondary"
                        className="gap-1 pl-2.5 pr-1.5 py-1 text-xs"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOption(opt)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Constraints */}
          <div className="flex flex-col gap-3">
            <Label>Constraints</Label>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">Required</p>
                <p className="text-xs text-muted-foreground">
                  Must have a value in every record
                </p>
              </div>
              <Switch checked={required} onCheckedChange={setRequired} />
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">Unique</p>
                <p className="text-xs text-muted-foreground">
                  No two records can share this value
                </p>
              </div>
              <Switch checked={unique} onCheckedChange={setUnique} />
            </div>
          </div>

          {/* Default value */}
          {field &&
            !["BOOLEAN", "SELECT", "MULTI_SELECT", "JSON"].includes(
              field.type,
            ) && (
              <>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <Label htmlFor="edit-default">Default value</Label>
                    <span className="text-xs text-muted-foreground">
                      optional
                    </span>
                  </div>
                  <Input
                    id="edit-default"
                    value={defaultValue}
                    onChange={(e) => setDefault(e.target.value)}
                    placeholder="Leave empty for none"
                  />
                </div>
              </>
            )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !label.trim()}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
