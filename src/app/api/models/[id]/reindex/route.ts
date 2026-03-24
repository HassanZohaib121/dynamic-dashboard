import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { reindexModel } from "@/lib/record-index";
import { RouteParams } from "@/lib/Api/Types";

export async function POST(_req: NextRequest, { params }: RouteParams) {
    const { id } = await params
  const model = await prisma.model.findUnique({
    where:  { id },
    select: { id: true, name: true },
  });
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const count = await reindexModel(model.id);

  return NextResponse.json({
    ok:      true,
    model:   model.name,
    indexed: count,
  });
}