import { Prisma } from "@/generated/prisma/client";
import { badRequest, notFound, resolveModel, toJsonValue } from "@/lib/Api/Helper";
import { RecordData, RouteParams } from "@/lib/Api/Types";
import { validateData } from "@/lib/Api/Validations";
import prisma from "@/lib/prisma";
import { syncRecordIndex } from "@/lib/record-index";
import { NextRequest, NextResponse } from "next/server";

// ─── GET ──────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { model } = await params;
  if (!model?.trim()) return badRequest("Model name is required");

  const { searchParams } = req.nextUrl;

  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip   = (page - 1) * limit;
  const sort   = searchParams.get("sort")  ?? "createdAt";
  const dir    = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const search = searchParams.get("search")?.trim() ?? "";

  // Column filters: ?filter[fieldName]=value
  const filters: Record<string, string> = {};
  for (const [key, val] of searchParams.entries()) {
    const m = key.match(/^filter\[(.+)\]$/);
    if (m && val) filters[m[1]] = val;
  }

  const modelData = await prisma.model.findUnique({
    where: { name: model },
    select: {
      id: true,
      fields: { select: { name: true, type: true }, orderBy: { order: "asc" } },
    },
  });
  if (!modelData) return notFound(`Model "${model}" not found`);

  // ── Build WHERE using RecordIndex for search + filters ──
  const andClauses: Prisma.RecordWhereInput[] = [{ modelId: modelData.id }];

  // Server-side full-text search via RecordIndex
  if (search) {
    const matchingIds = await prisma.recordIndex.findMany({
      where: {
        modelId:  modelData.id,
        value:    { contains: search, mode: "insensitive" },
      },
      select:  { recordId: true },
      distinct: ["recordId"],
    });
    const ids = matchingIds.map((r) => r.recordId);
    // If nothing matched, return empty immediately
    if (ids.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { page, limit, total: 0, totalPages: 0, count: 0, sort, dir },
      });
    }
    andClauses.push({ id: { in: ids } });
  }

  // Column filters via RecordIndex
  for (const [fieldName, filterVal] of Object.entries(filters)) {
    const matchingIds = await prisma.recordIndex.findMany({
      where: {
        modelId:   modelData.id,
        fieldName,
        value:     { contains: filterVal, mode: "insensitive" },
      },
      select:   { recordId: true },
      distinct: ["recordId"],
    });
    const ids = matchingIds.map((r) => r.recordId);
    if (ids.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { page, limit, total: 0, totalPages: 0, count: 0, sort, dir },
      });
    }
    andClauses.push({ id: { in: ids } });
  }

  const where: Prisma.RecordWhereInput = { AND: andClauses };

  const isTopLevel = ["createdAt", "updatedAt", "id"].includes(sort);
  const orderBy: Prisma.RecordOrderByWithRelationInput = isTopLevel
    ? { [sort]: dir }
    : { createdAt: dir };

  const [records, total] = await prisma.$transaction([
    prisma.record.findMany({
      where,
      orderBy,
      skip,
      take:   limit,
      select: { id: true, data: true, createdAt: true, updatedAt: true },
    }),
    prisma.record.count({ where }),
  ]);

  const formatted = records.map(({ id, data, createdAt, updatedAt }) => ({
    id,
    createdAt,
    updatedAt,
    ...((data as RecordData) ?? {}),
  }));

  return NextResponse.json({
    data: formatted,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count:      formatted.length,
      sort,
      dir,
    },
  });
}

// ─── POST ─────────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { model } = await params;
  if (!model?.trim()) return badRequest("Model name is required");

  let body: RecordData;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON body"); }

  const modelData = await resolveModel(model);
  if (!modelData) return notFound(`Model "${model}" not found`);

  const validation = validateData(body, modelData.fields);
  if (!validation.ok) return badRequest(validation.error!);

  for (const field of modelData.fields.filter((f) => f.unique)) {
    if (body[field.name] === undefined) continue;
    const dup = await prisma.record.findFirst({
      where: { modelId: modelData.id, data: { path: [field.name], equals: toJsonValue(body[field.name]) } },
      select: { id: true },
    });
    if (dup) return NextResponse.json(
      { error: `Value for "${field.name}" already exists`, field: field.name },
      { status: 409 }
    );
  }

  const record = await prisma.record.create({
    data:   { modelId: modelData.id, data: body as Prisma.InputJsonValue },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
  });

  // Sync index
  await syncRecordIndex(record.id, modelData.id, body);

  return NextResponse.json(
    { id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt, ...((record.data as RecordData) ?? {}) },
    { status: 201 }
  );
}