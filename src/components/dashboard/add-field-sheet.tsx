"use client";

import { useState } from "react";
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
import { FieldType, CreateFieldInput, Field } from "@/hooks/use-fields";
import { cn } from "@/lib/utils";

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] =
  [
    { value: "TEXT", label: "Text", description: "Short or long text" },
    { value: "NUMBER", label: "Number", description: "Integer or decimal" },
    { value: "DATE", label: "Date", description: "Calendar date" },
    { value: "BOOLEAN", label: "Boolean", description: "True / false toggle" },
    {
      value: "SELECT",
      label: "Select",
      description: "Single choice from a list",
    },
    {
      value: "MULTI_SELECT",
      label: "Multi-select",
      description: "Multiple choices",
    },
    { value: "JSON", label: "JSON", description: "Arbitrary JSON object" },
  ];

function slugify(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

interface AddFieldSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateFieldInput) => Promise<Field>;
}

export function AddFieldSheet({
  open,
  onOpenChange,
  onSubmit,
}: AddFieldSheetProps) {
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [type, setType] = useState<FieldType>("TEXT");
  const [required, setRequired] = useState(false);
  const [unique, setUnique] = useState(false);
  const [defaultValue, setDefault] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsOptions = type === "SELECT" || type === "MULTI_SELECT";

  const reset = () => {
    setLabel("");
    setName("");
    setNameEdited(false);
    setType("TEXT");
    setRequired(false);
    setUnique(false);
    setDefault("");
    setOptions([]);
    setOptionInput("");
    setError(null);
  };

  const handleLabelChange = (v: string) => {
    setLabel(v);
    if (!nameEdited) setName(slugify(v));
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (!val || options.includes(val)) return;
    setOptions((prev) => [...prev, val]);
    setOptionInput("");
  };

  const removeOption = (opt: string) =>
    setOptions((prev) => prev.filter((o) => o !== opt));

  const handleSubmit = async () => {
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (needsOptions && options.length === 0) {
      setError("Add at least one option for this field type");
      return;
    }

    const input: CreateFieldInput = {
      label: label.trim(),
      name,
      type,
      required,
      unique,
      ...(defaultValue.trim() && { defaultValue: defaultValue.trim() }),
      ...(needsOptions && { options }),
    };

    setLoading(true);
    try {
      await onSubmit(input);
      reset();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent className="w-105 sm:w-105 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-base">Add field</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Label + Name */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                placeholder="e.g. Product Name"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <Label htmlFor="field-name">Name</Label>
                <span className="text-xs text-muted-foreground">API key</span>
              </div>
              <Input
                id="field-name"
                placeholder="e.g. product_name"
                value={name}
                onChange={(e) => {
                  setName(slugify(e.target.value));
                  setNameEdited(true);
                }}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Field type */}
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => {
                    setType(ft.value);
                    setOptions([]);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all",
                    type === ft.value
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-border/80 hover:bg-muted/40",
                  )}
                >
                  <FieldTypeIcon type={ft.value} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-none truncate">
                      {ft.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {ft.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Options (SELECT / MULTI_SELECT only) */}
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

          {/* Default value — not for BOOLEAN / SELECT / MULTI_SELECT / JSON */}
          {!["BOOLEAN", "SELECT", "MULTI_SELECT", "JSON"].includes(type) && (
            <>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2">
                  <Label htmlFor="field-default">Default value</Label>
                  <span className="text-xs text-muted-foreground">
                    optional
                  </span>
                </div>
                <Input
                  id="field-default"
                  placeholder={
                    type === "NUMBER"
                      ? "0"
                      : type === "DATE"
                        ? "2024-01-01"
                        : "Leave empty"
                  }
                  value={defaultValue}
                  onChange={(e) => setDefault(e.target.value)}
                  className={cn(type === "NUMBER" && "font-mono")}
                />
              </div>
            </>
          )}

          {/* Error */}
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
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !label.trim() || !name.trim()}
          >
            {loading ? "Adding…" : "Add field"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
