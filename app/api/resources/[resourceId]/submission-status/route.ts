// app/api/resources/[resourceId]/submission-status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { resourceId: string | Promise<string> } }) {
  try {
    const { resourceId } = (await params) as { resourceId: string };

    // token from Authorization header OR cookie
    const auth = req.headers.get("authorization") || "";
    let token: string | null = null;
    if (auth.startsWith("Bearer ")) token = auth.split(" ")[1];
    else {
      const cookie = req.headers.get("cookie") || "";
      const m = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("token="));
      if (m) token = m.split("=")[1];
    }

    if (!token) return NextResponse.json({ submitted: false, submission: null });

    const payload = verifyToken(token as string) as any;
    if (!payload || !payload.id) return NextResponse.json({ submitted: false, submission: null });

    const studentId = payload.id;

    const submission = await prisma.submission.findUnique({
      where: { resourceId_studentId: { resourceId, studentId } as any },
    });

    return NextResponse.json({ submitted: !!submission, submission: submission ?? null });
  } catch (err) {
    console.error("GET /api/resources/[resourceId]/submission-status error:", err);
    return NextResponse.json({ submitted: false, submission: null }, { status: 500 });
  }
}
