// // app/api/submissions/[submissionId]/grade/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export async function PATCH(req: Request, { params }: { params: { submissionId: string | Promise<string> } }) {
//   try {
//     const { submissionId } = (await params) as { submissionId: string };

//     // auth
//     const authHeader = req.headers.get("authorization") || "";
//     let token: string | null = null;
//     if (authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
//     else {
//       const cookie = req.headers.get("cookie") || "";
//       const m = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith("token="));
//       if (m) token = m.split("=")[1];
//     }
//     if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const payload = verifyToken(token as string) as any;
//     if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const { graded = true, grade = null, feedback = null } = body;

//     // load submission + resource -> class -> teacher check
//     const submission = await prisma.submission.findUnique({
//       where: { id: submissionId },
//       include: { resource: { include: { class: true } } },
//     });
//     if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

//     if (payload.role !== "ADMIN" && submission.resource.class.teacherId !== payload.id) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const updated = await prisma.submission.update({
//       where: { id: submissionId },
//       data: { graded, grade: grade ?? undefined, comment: feedback ?? undefined },
//     });

//     return NextResponse.json({ ok: true, submission: updated });
//   } catch (err) {
//     console.error("PATCH /api/submissions/[id]/grade error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/submissions/[submissionId]/grade/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * PATCH /api/submissions/[submissionId]/grade
 * Note: Next's route handler context.params is Promise<{ submissionId: string }>
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await context.params;

    // auth
    const authHeader = req.headers.get("authorization") || "";
    let token: string | null = null;
    if (authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
    else {
      const cookie = req.headers.get("cookie") || "";
      const m = cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("token="));
      if (m) token = m.split("=")[1];
    }
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { graded = true, grade = null, feedback = null } = body;

    // load submission + resource -> class -> teacher check
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { resource: { include: { class: true } } },
    });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (payload.role !== "ADMIN" && submission.resource.class.teacherId !== payload.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { graded, grade: grade ?? undefined, comment: feedback ?? undefined },
    });

    return NextResponse.json({ ok: true, submission: updated });
  } catch (err) {
    console.error("PATCH /api/submissions/[submissionId]/grade error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
