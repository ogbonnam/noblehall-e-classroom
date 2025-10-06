// app/api/classes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // optional: support ?limit= / ?teacherId= queries
    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");

    const where = teacherId ? { teacherId } : {};
    const classes = await prisma.class.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(classes);
  } catch (err) {
    console.error("GET /api/classes error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

