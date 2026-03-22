import { Prisma } from "@/generated/prisma/client";
import { badRequest, conflict, notFound, resolveModel, toJsonValue } from "@/lib/Api/Helper";
import { RecordData, RouteParams } from "@/lib/Api/Types";
import { validateData } from "@/lib/Api/Validations";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─── GET ──────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { model } = params;
  if (!model?.trim()) return badRequest("Model name is required");

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip   = (page - 1) * limit;

  const modelData = await prisma.model.findUnique({
    where: { name: model },
    select: {
      id: true,
      records: {
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: { id: true, data: true, createdAt: true, updatedAt: true },
      },
    },
  });

  if (!modelData) return notFound(`Model "${model}" not found`);

  const formatted = modelData.records.map(({ id, data, createdAt, updatedAt }) => ({
    id,
    createdAt,
    updatedAt,
    ...((data as RecordData) ?? {}),
  }));

  return NextResponse.json({
    data: formatted,
    meta: { page, limit, count: formatted.length },
  });
}

// ─── POST  ─────────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { model } = params;
  if (!model?.trim()) return badRequest("Model name is required");

  let body: RecordData;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const modelData = await resolveModel(model);
  if (!modelData) return notFound(`Model "${model}" not found`);

  // Validate against field definitions
  const validation = validateData(body, modelData.fields);
  if (!validation.ok) return badRequest(validation.error!);

  // Unique field checks
  for (const field of modelData.fields.filter((f) => f.unique)) {
    if (body[field.name] === undefined) continue;
    const duplicate = await prisma.record.findFirst({
      where: {
        modelId: modelData.id,
        data: { path: [field.name], equals: toJsonValue(body[field.name]) },
      },
      select: { id: true },
    });
    if (duplicate) return conflict(`Value for "${field.name}" already exists`);
  }

  const record = await prisma.record.create({
    data: { modelId: modelData.id, data: body as Prisma.InputJsonValue },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(
    { id: record.id, createdAt: record.createdAt, ...((record.data as RecordData) ?? {}) },
    { status: 201 }
  );
}
