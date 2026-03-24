import { FieldType } from "@/generated/prisma/enums";
import { badRequest, conflict, notFound } from "@/lib/Api/Helper";
import { RouteParams } from "@/lib/Api/Types";
import prisma from "@/lib/prisma";
import { reindexModel } from "@/lib/record-index";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = Object.values(FieldType);

// ─── GET /api/models/[id]/fields ───────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const {id} = await params
  const model = await prisma.model.findUnique({
    where: { id }, select: { id: true },
  });
  if (!model) return notFound("Model not found");

  const fields = await prisma.field.findMany({
    where:   { modelId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(fields);
}

// ─── POST /api/models/[id]/fields ──────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const {id} = await params
  const model = await prisma.model.findUnique({
    where: { id }, select: { id: true },
  });
  if (!model) return notFound("Model not found");

  let body: {
    name?: string; label?: string; type?: string;
    required?: boolean; unique?: boolean;
    defaultValue?: string; options?: string[];
  };

  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON body"); }

  const name  = body.name?.trim().toLowerCase().replace(/\s+/g, "_");
  const label = body.label?.trim();
  const type  = body.type as FieldType;

  if (!name)  return badRequest("name is required");
  if (!label) return badRequest("label is required");
  if (!type || !VALID_TYPES.includes(type))
    return badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
  if (!/^[a-z_][a-z0-9_]*$/.test(name))
    return badRequest("name must be lowercase letters, numbers, or underscores");

  const existing = await prisma.field.findUnique({
    where: { modelId_name: { modelId: id, name } },
  });
  if (existing) return conflict(`Field "${name}" already exists on this model`);

  if ((type === "SELECT" || type === "MULTI_SELECT") && !body.options?.length)
    return badRequest("options are required for SELECT and MULTI_SELECT fields");

  const maxOrder = await prisma.field.aggregate({
    where: { modelId: id },
    _max:  { order: true },
  });

  const field = await prisma.field.create({
    data: {
      modelId:      id,
      name,
      label,
      type,
      required:     body.required     ?? false,
      unique:       body.unique       ?? false,
      defaultValue: body.defaultValue ?? null,
      options:      (type === "SELECT" || type === "MULTI_SELECT") ? body.options : undefined,
      order:        (maxOrder._max.order ?? -1) + 1,
    },
  });

  // Back-fill RecordIndex for all existing records so the new field
  // is immediately searchable/filterable without a manual reindex
  const recordCount = await prisma.record.count({ where: { modelId: id } });
  if (recordCount > 0) {
    // Run async — don't block the response
    reindexModel(id).catch(console.error);
  }

  return NextResponse.json(field, { status: 201 });
}