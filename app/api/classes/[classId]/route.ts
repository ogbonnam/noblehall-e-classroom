// // app/api/classes/[classId]/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(_: Request, { params }: { params: { classId: string | Promise<string> } }) {
//   try {
//     // Await the whole params object, then destructure.
//     const { classId } = (await params) as { classId: string };

//     const cls = await prisma.class.findUnique({
//       where: { id: classId },
//       include: { resources: true, teacher: true },
//     });

//     if (!cls) {
//       return NextResponse.json({ error: "Class not found" }, { status: 404 });
//     }

//     return NextResponse.json(cls);
//   } catch (err) {
//     console.error("GET /api/classes/[classId] error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/classes/[classId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Note: Next's route handler context.params is Promise<{ classId: string }>
 * so all handlers use: context: { params: Promise<{ classId: string }> }
 */

export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await context.params;

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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await context.params;

    const token = extractTokenFromHeadersOrCookie(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });
    const payload = verifyToken(token as string) as any;
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Only teacher owner or ADMIN can edit
    if (payload.role !== "ADMIN" && cls.teacherId !== payload.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: any = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.term === "string") updates.term = body.term;
    if (typeof body.subterm === "string") updates.subterm = body.subterm;

    const updated = await prisma.class.update({
      where: { id: classId },
      data: updates,
    });

    return NextResponse.json({ ok: true, class: updated });
  } catch (err) {
    console.error("PATCH /api/classes/[classId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await context.params;

    const token = extractTokenFromHeadersOrCookie(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });
    const payload = verifyToken(token as string) as any;
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const cls = await prisma.class.findUnique({ where: { id: classId }, include: { resources: true } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Only teacher owner or ADMIN can delete
    if (payload.role !== "ADMIN" && cls.teacherId !== payload.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete files on disk for each resource and submission
    for (const res of cls.resources || []) {
      try {
        if (res.filePath) {
          const filePath = path.join(process.cwd(), "public", res.filePath.replace(/^\//, ""));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        const subs = await prisma.submission.findMany({ where: { resourceId: res.id } });
        for (const s of subs) {
          try {
            if (s.filePath) {
              const sf = path.join(process.cwd(), "public", s.filePath.replace(/^\//, ""));
              if (fs.existsSync(sf)) fs.unlinkSync(sf);
            }
          } catch (e) {
            console.warn("Failed to delete submission file", e);
          }
        }
      } catch (e) {
        console.warn("Error deleting resource/submission files", e);
      }
    }

    // Delete DB rows in a transaction
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { resource: { classId } } as any }),
      prisma.resourceView.deleteMany({ where: { resource: { classId } } as any }),
      prisma.resource.deleteMany({ where: { classId } }),
      prisma.enrollment.deleteMany({ where: { classId } }),
      prisma.class.delete({ where: { id: classId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/classes/[classId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
