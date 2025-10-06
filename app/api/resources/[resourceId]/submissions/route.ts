// // app/api/resources/[resourceId]/submissions/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export async function GET(req: Request, { params }: { params: { resourceId: string | Promise<string> } }) {
//   try {
//     const { resourceId } = (await params) as { resourceId: string };

//     // --- token extraction
//     const auth = req.headers.get("authorization") || "";
//     let token: string | null = null;
//     if (auth.startsWith("Bearer ")) token = auth.split(" ")[1];
//     else {
//       const cookie = req.headers.get("cookie") || "";
//       const m = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("token="));
//       if (m) token = m.split("=")[1];
//     }
//     if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const payload = verifyToken(token as string) as any;
//     if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN"))
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // Fetch submissions
//     const submissions = await prisma.submission.findMany({
//       where: { resourceId },
//       include: { student: { select: { id: true, name: true, email: true } } },
//       orderBy: { createdAt: "desc" },
//     });

//     return NextResponse.json({ submissions });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }

// app/api/resources/[resourceId]/submissions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/resources/[resourceId]/submissions
 * Note: Next's route handler context.params is a Promise<{ resourceId: string }>
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await context.params;

    // --- token extraction
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
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch submissions
    const submissions = await prisma.submission.findMany({
      where: { resourceId },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("GET /api/resources/[resourceId]/submissions error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
