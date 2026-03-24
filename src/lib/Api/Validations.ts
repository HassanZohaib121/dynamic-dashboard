import { FieldMeta, RecordData, ValidationResult } from "./Types";

export function validateData(data: RecordData, fields: FieldMeta[]): ValidationResult {
  for (const field of fields) {
    const value = data[field.name];

    // Required check
    if (field.required && (value === undefined || value === null || value === "")) {
      return { ok: false, error: `Field "${field.name}" is required` };
    }

    if (value === undefined || value === null) continue;

    // Type checks
    if (field.type === "NUMBER" && typeof value !== "number") {
      return { ok: false, error: `Field "${field.name}" must be a number` };
    }
    if (field.type === "BOOLEAN" && typeof value !== "boolean") {
      return { ok: false, error: `Field "${field.name}" must be a boolean` };
    }
    if (field.type === "DATE" && isNaN(Date.parse(String(value)))) {
      return { ok: false, error: `Field "${field.name}" must be a valid date` };
    }
  }

  return { ok: true };
}