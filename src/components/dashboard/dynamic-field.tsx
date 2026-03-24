"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { FieldDefinition } from "@/hooks/use-model-fields";

interface DynamicFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
}: DynamicFieldProps) {
  const inputId = `field-${field.id}`;

  const renderInput = () => {
    switch (field.type) {
      // ── TEXT ────────────────────────────────────────────
      case "TEXT":
        return (
          <Input
            id={inputId}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              field.defaultValue ?? `Enter ${field.label.toLowerCase()}`
            }
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
            )}
          />
        );

      // ── NUMBER ──────────────────────────────────────────
      case "NUMBER":
        return (
          <Input
            id={inputId}
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder={field.defaultValue ?? "0"}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
            )}
          />
        );

      // ── DATE ────────────────────────────────────────────
      case "DATE":
        return (
          <Input
            id={inputId}
            type="date"
            value={
              value ? new Date(value as string).toISOString().split("T")[0] : ""
            }
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
            )}
          />
        );

      // ── BOOLEAN ─────────────────────────────────────────
      case "BOOLEAN":
        return (
          <div className="flex items-center gap-3 h-10">
            <Switch
              id={inputId}
              checked={Boolean(value)}
              onCheckedChange={onChange}
            />
            <span className="text-sm text-muted-foreground">
              {Boolean(value) ? "True" : "False"}
            </span>
          </div>
        );

      // ── SELECT ──────────────────────────────────────────
      case "SELECT": {
        const options = field.options ?? [];
        return (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger
              id={inputId}
              className={cn(error && "border-destructive")}
            >
              <SelectValue
                placeholder={`Select ${field.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {!field.required && (
                <SelectItem value="">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
              )}
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      // ── MULTI_SELECT ────────────────────────────────────
      case "MULTI_SELECT": {
        const options = field.options ?? [];
        const selected: string[] = Array.isArray(value)
          ? (value as string[])
          : [];

        const toggle = (opt: string) => {
          const next = selected.includes(opt)
            ? selected.filter((s) => s !== opt)
            : [...selected, opt];
          onChange(next);
        };

        return (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt) => {
                const active = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    {opt}
                    {active && <X className="w-2.5 h-2.5" />}
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selected.length} selected
              </p>
            )}
          </div>
        );
      }

      // ── JSON ────────────────────────────────────────────
      case "JSON": {
        const display =
          value == null
            ? ""
            : typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2);

        const handleChange = (raw: string) => {
          try {
            onChange(JSON.parse(raw));
          } catch {
            onChange(raw); // keep raw string while user is typing
          }
        };

        return (
          <Textarea
            id={inputId}
            value={display}
            onChange={(e) => handleChange(e.target.value)}
            placeholder='{"key": "value"}'
            rows={4}
            className={cn(
              "font-mono text-xs resize-y",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.type !== "BOOLEAN" ? inputId : undefined}
          className="text-sm font-medium"
        >
          {field.label}
        </Label>
        {field.required && (
          <span className="text-destructive text-xs leading-none">*</span>
        )}
        {field.unique && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 h-4 font-normal"
          >
            unique
          </Badge>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">
          {field.type.replace("_", " ")}
        </span>
      </div>

      {/* Input */}
      {renderInput()}

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
