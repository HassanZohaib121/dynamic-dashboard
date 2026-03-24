import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RouteParams } from "@/lib/Api/Types";

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { model } = await params;

  let body: { ids?: string[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  const modelData = await prisma.model.findUnique({
    where:  { name: model },
    select: { id: true },
  });
  if (!modelData) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  // Verify all ids belong to this model
  const records = await prisma.record.findMany({
    where:  { id: { in: body.ids }, modelId: modelData.id },
    select: { id: true },
  });

  const validIds = records.map((r) => r.id);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "No matching records found" }, { status: 404 });
  }

  // Clean index then delete records in a transaction
  await prisma.$transaction([
    prisma.recordIndex.deleteMany({ where: { recordId: { in: validIds } } }),
    prisma.record.deleteMany({ where: { id: { in: validIds } } }),
  ]);

  return NextResponse.json({ deleted: validIds.length });
}