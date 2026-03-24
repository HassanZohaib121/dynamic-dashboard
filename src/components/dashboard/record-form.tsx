"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { ModelWithFields, FieldDefinition } from "@/hooks/use-model-fields";
import { DynamicField } from "./dynamic-field";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ShortcutHint } from "./shortcut-hint";
import { toast } from "@/lib/toast";

interface RecordFormProps {
  model: ModelWithFields;
  initialData?: Record<string, unknown>;
  recordId?: string;
}

type FieldErrors = Record<string, string>;

function getDefaultValue(field: FieldDefinition): unknown {
  if (field.defaultValue !== null) {
    if (field.type === "NUMBER") return Number(field.defaultValue);
    if (field.type === "BOOLEAN") return field.defaultValue === "true";
    return field.defaultValue;
  }
  if (field.type === "BOOLEAN") return false;
  if (field.type === "MULTI_SELECT") return [];
  return "";
}

function buildInitialValues(
  fields: FieldDefinition[],
  seed?: Record<string, unknown>,
) {
  return Object.fromEntries(
    fields.map((f) => [f.name, seed?.[f.name] ?? getDefaultValue(f)]),
  );
}

function clientValidate(
  fields: FieldDefinition[],
  values: Record<string, unknown>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    const val = values[field.name];
    const empty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);
    if (field.required && empty) {
      errors[field.name] = `${field.label} is required`;
      continue;
    }
    if (!empty) {
      if (field.type === "NUMBER" && isNaN(Number(val)))
        errors[field.name] = `${field.label} must be a number`;
      if (
        field.type === "DATE" &&
        typeof val === "string" &&
        isNaN(Date.parse(val))
      )
        errors[field.name] = `${field.label} must be a valid date`;
      if (field.type === "JSON" && typeof val === "string") {
        try {
          JSON.parse(val);
        } catch {
          errors[field.name] = `${field.label} must be valid JSON`;
        }
      }
    }
  }
  return errors;
}

function isDeepEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function RecordForm({ model, initialData, recordId }: RecordFormProps) {
  const router = useRouter();
  const isEdit = !!recordId;
  const backUrl = `/dashboard/${model.name}`;
  const initial = buildInitialValues(model.fields, initialData);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDirty = !isDeepEqual(values, initial);
  const { safeNavigate } = useUnsavedChanges(isDirty && !loading);

  // Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const setField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const errors = clientValidate(model.fields, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the errors below");
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const field of model.fields) {
      const val = values[field.name];
      if (val === "" && !field.required) continue;
      payload[field.name] = val;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/api/dynamic/${model.name}/${recordId}`
        : `/api/dynamic/${model.name}`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        else setSubmitError(data.error ?? "Something went wrong");
        toast.error(
          isEdit ? "Failed to save record" : "Failed to create record",
          data.error,
        );
        return;
      }

      toast.success(isEdit ? "Record saved" : "Record created");
      router.push(backUrl);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setSubmitError(msg);
      toast.error("Unexpected error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 -ml-2"
          onClick={() => safeNavigate(backUrl)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            className="hover:text-foreground transition-colors"
            onClick={() => safeNavigate(backUrl)}
          >
            {model.label}
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">
            {isEdit ? "Edit record" : "New record"}
          </span>
        </div>

        {/* Dirty indicator */}
        {isDirty && (
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-base font-medium">
            {isEdit ? "Edit record" : "New record"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit
              ? `Editing record in ${model.label}`
              : `Fill in the fields to create a new ${model.label} record`}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {model.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No fields defined for this model.
            </p>
          ) : (
            model.fields.map((field, i) => (
              <div key={field.id}>
                <DynamicField
                  field={field}
                  value={values[field.name]}
                  onChange={(val) => setField(field.name, val)}
                  error={fieldErrors[field.name]}
                />
                {i < model.fields.length - 1 && <Separator className="mt-5" />}
              </div>
            ))
          )}
        </div>

        {submitError && (
          <div className="px-6 pb-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => safeNavigate(backUrl)}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <ShortcutHint keys={["⌘", "↵"]} size="20" />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || model.fields.length === 0}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {loading
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create record"}
            </Button>
          </div>
        </div>
      </div>

      {isEdit && recordId && (
        <p className="mt-3 text-center text-xs text-muted-foreground font-mono">
          id: {recordId}
        </p>
      )}
    </div>
  );
}
