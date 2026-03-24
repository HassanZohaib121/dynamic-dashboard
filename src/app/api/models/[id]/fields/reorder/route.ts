import  prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound } from "@/lib/Api/Helper";
import { RouteParams } from "@/lib/Api/Types";

// ─── PATCH ─────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const model = await prisma.model.findUnique({
    where: { id: (await params).id },
    select: { id: true },
  });
  if (!model) return notFound("Model not found");

  let body: { order?: string[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return badRequest("order must be a non-empty array of field IDs");
  }

  // Verify all IDs belong to this model
  const fields = await prisma.field.findMany({
    where: { modelId: (await params).id },
    select: { id: true },
  });
  const validIds = new Set(fields.map((f) => f.id));
  const invalid  = body.order.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return badRequest(`Unknown field IDs: ${invalid.join(", ")}`);
  }

  // Batch update order using a transaction
  await prisma.$transaction(
    body.order.map((fieldId, index) =>
      prisma.field.update({
        where: { id: fieldId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}