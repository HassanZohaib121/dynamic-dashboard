import { badRequest, conflict } from "@/lib/Api/Helper";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─── GET ────────────────────────────────────
// Returns all models with field count and record count
export async function GET() {
  const models = await prisma.model.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      label: true,
      createdAt: true,
      _count: {
        select: { fields: true, records: true },
      },
    },
  });

  return NextResponse.json(models);
}

// ─── POST ───────────────────────────────────
// Creates a new model (table)
export async function POST(req: NextRequest) {
  let body: { name?: string; label?: string };

  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const name  = body.name?.trim().toLowerCase().replace(/\s+/g, "_");
  const label = body.label?.trim();

  if (!name)  return badRequest("name is required");
  if (!label) return badRequest("label is required");

  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    return badRequest("name must be lowercase letters, numbers, or underscores");
  }

  const existing = await prisma.model.findUnique({ where: { name } });
  if (existing) return conflict(`Model "${name}" already exists`);

  const model = await prisma.model.create({
    data: { name, label },
    select: { id: true, name: true, label: true, createdAt: true },
  });

  return NextResponse.json(model, { status: 201 });
}