import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { badRequest, notFound, toJsonValue } from "@/lib/Api/Helper";
import { RecordData, RouteParams } from "@/lib/Api/Types";
import { deleteRecordIndex, syncRecordIndex } from "@/lib/record-index";
import { NextRequest, NextResponse } from "next/server";

// ─── GET /api/dynamic/[model]/[id] ─────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { model, id } = await params;

  const modelData = await prisma.model.findUnique({
    where:  { name: model },
    select: { id: true },
  });
  if (!modelData) return notFound(`Model "${model}" not found`);

  const record = await prisma.record.findFirst({
    where:  { id, modelId: modelData.id },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
  });
  if (!record) return notFound(`Record "${id}" not found`);

  return NextResponse.json({
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...((record.data as RecordData) ?? {}),
  });
}

// ─── PUT /api/dynamic/[model]/[id] ─────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { model, id } = await params;
  if (!id?.trim()) return badRequest("Record ID is required");

  let body: RecordData;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON body"); }

  if (Object.keys(body).length === 0) return badRequest("Body must not be empty");

  const modelData = await prisma.model.findUnique({
    where:  { name: model },
    select: {
      id: true,
      fields: { select: { name: true, type: true, required: true, unique: true } },
    },
  });
  if (!modelData) return notFound(`Model "${model}" not found`);

  const existing = await prisma.record.findFirst({
    where:  { id, modelId: modelData.id },
    select: { id: true, data: true },
  });
  if (!existing) return notFound(`Record "${id}" not found`);

  // Validate only the fields being updated
  const fieldsToValidate = modelData.fields.filter((f) => body[f.name] !== undefined);
  for (const field of fieldsToValidate) {
    const value = body[field.name];
    if (field.type === "NUMBER"  && typeof value !== "number")
      return badRequest(`Field "${field.name}" must be a number`);
    if (field.type === "BOOLEAN" && typeof value !== "boolean")
      return badRequest(`Field "${field.name}" must be a boolean`);
    if (field.type === "DATE"    && isNaN(Date.parse(String(value))))
      return badRequest(`Field "${field.name}" must be a valid date`);
  }

  // Unique checks (excluding self)
  for (const field of fieldsToValidate.filter((f) => f.unique)) {
    const dup = await prisma.record.findFirst({
      where: {
        modelId: modelData.id,
        id:      { not: id },
        data:    { path: [field.name], equals: toJsonValue(body[field.name]) },
      },
      select: { id: true },
    });
    if (dup) return NextResponse.json(
      { error: `Value for "${field.name}" already exists`, field: field.name },
      { status: 409 }
    );
  }

  const merged = { ...(existing.data as RecordData), ...body };

  const updated = await prisma.record.update({
    where:  { id },
    data:   { data: merged as Prisma.InputJsonValue },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
  });

  // Sync index with merged data
  await syncRecordIndex(id, modelData.id, merged);

  return NextResponse.json({
    id:        updated.id,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    ...((updated.data as RecordData) ?? {}),
  });
}

// ─── DELETE /api/dynamic/[model]/[id] ──────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { model, id } = await params;

  const modelData = await prisma.model.findUnique({
    where:  { name: model },
    select: { id: true },
  });
  if (!modelData) return notFound(`Model "${model}" not found`);

  const existing = await prisma.record.findFirst({
    where:  { id, modelId: modelData.id },
    select: { id: true },
  });
  if (!existing) return notFound(`Record "${id}" not found`);

  // Delete index first (FK constraint), then record
  await deleteRecordIndex(id);
  await prisma.record.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}