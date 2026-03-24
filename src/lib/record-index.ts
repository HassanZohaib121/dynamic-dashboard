import prisma from "./prisma";
import { FieldType } from "@/generated/prisma/enums";

const INDEXABLE_TYPES: FieldType[] = [
  FieldType.TEXT,
  FieldType.NUMBER,
  FieldType.DATE,
  FieldType.BOOLEAN,
  FieldType.SELECT,
  FieldType.MULTI_SELECT,
];

function toIndexValue(value: unknown, type: FieldType): string[] {
  if (value === null || value === undefined || value === "") return [];

  switch (type) {
    case FieldType.MULTI_SELECT:
      return Array.isArray(value) ? (value as string[]).map(String) : [String(value)];
    case FieldType.BOOLEAN:
      return [value ? "true" : "false"];
    case FieldType.DATE:
      // Store both ISO string and YYYY-MM-DD for flexible matching
      try {
        const d = new Date(value as string);
        return [d.toISOString(), d.toISOString().split("T")[0]];
      } catch {
        return [String(value)];
      }
    default:
      return [String(value)];
  }
}

export async function syncRecordIndex(
  recordId: string,
  modelId: string,
  data: Record<string, unknown>
): Promise<void> {
  // Fetch field definitions for this model
  const fields = await prisma.field.findMany({
    where: { modelId, type: { in: INDEXABLE_TYPES } },
    select: { name: true, type: true },
  });

  // Build all index rows
  const entries: { recordId: string; modelId: string; fieldName: string; value: string }[] = [];

  for (const field of fields) {
    const raw    = data[field.name];
    const values = toIndexValue(raw, field.type);
    for (const value of values) {
      entries.push({ recordId, modelId, fieldName: field.name, value });
    }
  }

  // Replace all existing index rows for this record atomically
  await prisma.$transaction([
    prisma.recordIndex.deleteMany({ where: { recordId } }),
    ...(entries.length > 0
      ? [prisma.recordIndex.createMany({ data: entries })]
      : []),
  ]);
}

export async function deleteRecordIndex(recordId: string): Promise<void> {
  await prisma.recordIndex.deleteMany({ where: { recordId } });
}

// Full re-index a model — useful for back-filling after adding a new field
export async function reindexModel(modelId: string): Promise<number> {
  const [fields, records] = await Promise.all([
    prisma.field.findMany({
      where: { modelId, type: { in: INDEXABLE_TYPES } },
      select: { name: true, type: true },
    }),
    prisma.record.findMany({
      where: { modelId },
      select: { id: true, data: true },
    }),
  ]);

  const allEntries: { recordId: string; modelId: string; fieldName: string; value: string }[] = [];

  for (const record of records) {
    const data = (record.data ?? {}) as Record<string, unknown>;
    for (const field of fields) {
      const values = toIndexValue(data[field.name], field.type);
      for (const value of values) {
        allEntries.push({
          recordId:  record.id,
          modelId,
          fieldName: field.name,
          value,
        });
      }
    }
  }

  await prisma.$transaction([
    prisma.recordIndex.deleteMany({ where: { modelId } }),
    ...(allEntries.length > 0
      ? [prisma.recordIndex.createMany({ data: allEntries, skipDuplicates: true })]
      : []),
  ]);

  return records.length;
}