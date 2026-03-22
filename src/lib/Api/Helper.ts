import { NextResponse } from "next/server";
import prisma from "../prisma";
import { Prisma } from "@/generated/prisma/client";

// ─── HELPERS ───────────────────────────────────────────
export const notFound   = (msg: string) => NextResponse.json({ error: msg }, { status: 404 });
export const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
export const conflict   = (msg: string) => NextResponse.json({ error: msg }, { status: 409 });

export async function resolveModel(name: string) {
  return prisma.model.findUnique({
    where: { name },
    select: { id: true, fields: { select: { name: true, type: true, required: true, unique: true } } },
  });
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
