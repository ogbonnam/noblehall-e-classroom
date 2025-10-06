// app/api/classes/[classId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { classId: string | Promise<string> } }) {
  try {
    // Await the whole params object, then destructure.
    const { classId } = (await params) as { classId: string };

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { resources: true, teacher: true },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(cls);
  } catch (err) {
    console.error("GET /api/classes/[classId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
