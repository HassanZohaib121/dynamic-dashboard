export interface RouteParams {
  params: Promise<{ model: string, id: string; fieldId: string }>
}

export type RecordData = Record<string, unknown>;

export type FieldMeta = { name: string; type: string; required: boolean; unique: boolean };

export interface ValidationResult {
  ok: boolean;
  error?: string;
}