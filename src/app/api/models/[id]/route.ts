import { badRequest, notFound } from "@/lib/Api/Helper";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET ───────────────────────────────
// Returns a single model with its fields
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const model = await prisma.model.findUnique({
    where: { id: (await params).id },
    select: {
      id: true,
      name: true,
      label: true,
      createdAt: true,
      fields: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          label: true,
          type: true,
          required: true,
          unique: true,
          defaultValue: true,
          options: true,
          order: true,
        },
      },
      _count: { select: { records: true } },
    },
  });

  if (!model) return notFound(`Model not found`);
  return NextResponse.json(model);
}

// ─── PATCH ─────────────────────────────
// Updates label (name is immutable once created)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let body: { label?: string };

  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const label = body.label?.trim();
  if (!label) return badRequest("label is required");

  const existing = await prisma.model.findUnique({ where: { id: (await params).id } });
  if (!existing) return notFound("Model not found");

  const updated = await prisma.model.update({
    where: { id: (await params).id },
    data: { label },
    select: { id: true, name: true, label: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

// ─── DELETE ────────────────────────────
// Deletes model and all its fields + records (cascade)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const existing = await prisma.model.findUnique({ where: { id: (await params).id } });
  if (!existing) return notFound("Model not found");

  await prisma.model.delete({ where: { id: (await params).id } });
  return new NextResponse(null, { status: 204 });
}