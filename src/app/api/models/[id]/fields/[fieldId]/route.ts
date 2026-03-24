import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound } from "@/lib/Api/Helper";
import { RouteParams } from "@/lib/Api/Types";

// ─── PATCH ───────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const {id, fieldId} = await params
  const field = await prisma.field.findFirst({
    where: { id: fieldId, modelId: id },
  });
  if (!field) return notFound("Field not found");

  let body: {
    label?: string;
    required?: boolean;
    unique?: boolean;
    defaultValue?: string | null;
    options?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: {
      ...(body.label        !== undefined && { label: body.label.trim() }),
      ...(body.required     !== undefined && { required: body.required }),
      ...(body.unique       !== undefined && { unique: body.unique }),
      ...(body.defaultValue !== undefined && { defaultValue: body.defaultValue }),
      ...(body.options      !== undefined && { options: body.options }),
    },
  });

  return NextResponse.json(updated);
}

// ─── DELETE ──────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const {id, fieldId} = await params
  console.log(id, fieldId)
  const field = await prisma.field.findFirst({
    where: { id: fieldId, modelId: id },
  });
  if (!field) return notFound("Field not found");

  await prisma.field.delete({ where: { id: fieldId } });
  return new NextResponse(null, { status: 204 });
}