// app/api/teacher/recent-submissions-per-class/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

function extractTokenFromHeadersOrCookie(headers: Headers) {
  const auth = headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];
  const cookie = headers.get("cookie") || "";
  const tokenCookie = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("token="));
  if (tokenCookie) return tokenCookie.split("=")[1];
  return null;
}

export async function GET(req: Request) {
  try {
    // auth
    const token = extractTokenFromHeadersOrCookie(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Decide teacherId: teachers see their own classes. Admins must supply teacherId query param.
    const url = new URL(req.url);
    const teacherIdQuery = url.searchParams.get("teacherId") || undefined;

    let teacherId: string | undefined;
    if (payload.role === "TEACHER") {
      teacherId = payload.id;
    } else if (payload.role === "ADMIN") {
      if (!teacherIdQuery) {
        return NextResponse.json(
          { error: "Admin must supply teacherId query param, e.g. ?teacherId=abc" },
          { status: 400 }
        );
      }
      teacherId = teacherIdQuery;
    } else {
      return NextResponse.json({ error: "Forbidden - must be teacher or admin" }, { status: 403 });
    }

    // fetch classes taught by teacher
    const classes = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true, title: true, createdAt: true }, // include createdAt so we can sort if needed
      orderBy: { createdAt: "desc" }, // use createdAt (replace with any existing timestamp field)
      take: 200, // safety cap: adjust if needed
    });

    if (!classes || classes.length === 0) {
      return NextResponse.json({ ok: true, classes: [] });
    }

    // For each class, fetch up to 4 latest submissions (run in parallel)
    const perClassPromises = classes.map(async (cls) => {
      const subs = await prisma.submission.findMany({
        where: {
          resource: { classId: cls.id },
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          resource: { select: { id: true, title: true, filePath: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      return {
        classId: cls.id,
        classTitle: cls.title,
        submissions: subs.map((s) => ({
          id: s.id,
          student: s.student,
          resourceId: s.resource?.id,
          resourceTitle: s.resource?.title,
          filePath: s.filePath,
          createdAt: s.createdAt,
          graded: (s as any).graded ?? false,
          grade: (s as any).grade ?? null,
        })),
      };
    });

    const results = await Promise.all(perClassPromises);

    // Filter out classes with zero submissions if you only want classes that have activity
    const classesWithActivity = results.filter((r) => r.submissions.length > 0);

    // Sort by most recent submission (desc)
    classesWithActivity.sort((a, b) => {
      const aDate = a.submissions[0]?.createdAt ? new Date(a.submissions[0].createdAt).getTime() : 0;
      const bDate = b.submissions[0]?.createdAt ? new Date(b.submissions[0].createdAt).getTime() : 0;
      return bDate - aDate;
    });

    return NextResponse.json({ ok: true, classes: classesWithActivity });
  } catch (err) {
    console.error("GET /api/teacher/recent-submissions-per-class error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
