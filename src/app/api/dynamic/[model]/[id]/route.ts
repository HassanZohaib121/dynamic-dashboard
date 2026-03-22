import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, notFound, resolveModel, toJsonValue } from "@/lib/Api/Helper";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { RecordData, RouteParams } from "@/lib/Api/Types";
import { validateData } from "@/lib/Api/Validations";

export async function PUT(req: NextRequest, { params }: RouteParams & { params: { id?: string } }) {
  const { model } = params;
  const id = req.nextUrl.pathname.split("/").pop(); // extract [id] from URL

  if (!model?.trim()) return badRequest("Model name is required");
  if (!id?.trim())    return badRequest("Record ID is required");

  let body: RecordData;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (Object.keys(body).length === 0) return badRequest("Body must not be empty");

  const modelData = await resolveModel(model);
  if (!modelData) return notFound(`Model "${model}" not found`);

  // Check record exists and belongs to this model
  const existing = await prisma.record.findFirst({
    where: { id, modelId: modelData.id },
    select: { id: true, data: true },
  });
  if (!existing) return notFound(`Record "${id}" not found`);

  // Validate only the fields being updated
  const fieldsToValidate = modelData.fields.filter((f) => body[f.name] !== undefined);
  const validation = validateData(body, fieldsToValidate);
  if (!validation.ok) return badRequest(validation.error!);

  // Unique checks (excluding self)
  for (const field of fieldsToValidate.filter((f) => f.unique)) {
    const duplicate = await prisma.record.findFirst({
      where: {
        modelId: modelData.id,
        id: { not: id },
        data: { path: [field.name], equals: toJsonValue(body[field.name]) },
      },
      select: { id: true },
    });
    if (duplicate) return conflict(`Value for "${field.name}" already exists`);
  }

  // Merge existing data with updates (PATCH semantics inside PUT)
  const merged = { ...(existing.data as RecordData), ...body };

  const updated = await prisma.record.update({
    where: { id },
    data: { data: merged as Prisma.InputJsonValue },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({
    id: updated.id,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    ...((updated.data as RecordData) ?? {}),
  });
}

// ─── DELETE ──────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { model } = params;
  const id = req.nextUrl.pathname.split("/").pop();

  if (!model?.trim()) return badRequest("Model name is required");
  if (!id?.trim())    return badRequest("Record ID is required");

  const modelData = await prisma.model.findUnique({
    where: { name: model },
    select: { id: true },
  });
  if (!modelData) return notFound(`Model "${model}" not found`);

  const existing = await prisma.record.findFirst({
    where: { id, modelId: modelData.id },
    select: { id: true },
  });
  if (!existing) return notFound(`Record "${id}" not found`);

  await prisma.record.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}