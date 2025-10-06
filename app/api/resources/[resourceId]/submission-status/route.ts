// 

// app/api/resources/[resourceId]/submission-status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/resources/[resourceId]/submission-status
 * Note: Next's route handler context.params is a Promise<{ resourceId: string }>
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await context.params;

    // token from Authorization header OR cookie
    const auth = request.headers.get("authorization") || "";
    let token: string | null = null;
    if (auth.startsWith("Bearer ")) token = auth.split(" ")[1];
    else {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("token="));
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
