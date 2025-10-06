// // app/api/classes/[classId]/join/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export async function POST(req: Request, { params }: { params: { classId: string | Promise<string> } }) {
//   try {
//     // await the full params object, then destructure
//     const { classId } = (await params) as { classId: string };

//     // --- token extraction (Authorization header OR cookie token=...)
//     const authHeader = req.headers.get("authorization") || "";
//     let token: string | null = null;
//     if (authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
//     else {
//       const cookie = req.headers.get("cookie") || "";
//       const cookieToken = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("token="));
//       if (cookieToken) token = cookieToken.split("=")[1];
//     }

//     if (!token) return NextResponse.json({ error: "Unauthorized - no token provided" }, { status: 401 });

//     const payload = verifyToken(token as string) as any;
//     if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

//     const userId = payload.id;

//     // read body (expects { code } or no body if server checks by classId)
//     // We'll accept both: if client sends code, check it; otherwise assume they know the classId and verify code not necessary.
//     let body: any = {};
//     try { body = await req.json(); } catch (e) { body = {}; }

//     // optional: if you want to check the code matches class.code
//     if (body.code) {
//       const clsByCode = await prisma.class.findUnique({ where: { code: body.code } });
//       if (!clsByCode || clsByCode.id !== classId) {
//         return NextResponse.json({ error: "Wrong class code" }, { status: 400 });
//       }
//     }

//     // ensure class exists
//     const cls = await prisma.class.findUnique({ where: { id: classId } });
//     if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

//     // create enrollment if not exists
//     const existing = await prisma.enrollment.findUnique({
//       where: { userId_classId: { userId, classId } } // composite unique: please ensure you have @@unique([userId, classId]) in schema
//     }).catch(()=>null);

//     if (existing) {
//       return NextResponse.json({ ok: true, message: "Already joined" });
//     }

//     await prisma.enrollment.create({
//       data: { userId, classId }
//     });

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("POST /api/classes/[classId]/join error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/classes/[classId]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function extractTokenFromHeadersOrCookie(headers: Headers) {
  const authHeader = headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];

  const cookieHeader = headers.get("cookie") || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("token="));
  if (tokenCookie) return tokenCookie.split("=")[1];
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ classId: string }> } // <-- important: params is a Promise<{ classId }>
) {
  try {
    // unwrap params as Next requires
    const { classId } = await context.params;

    // extract token (Authorization header or cookie)
    const token = extractTokenFromHeadersOrCookie(request.headers);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - no token provided" }, { status: 401 });
    }

    const payload = verifyToken(token as string) as any;
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });
    }
    const userId = payload.id;

    // try parse body (client may send { code } or empty)
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    // optional code check
    if (body.code) {
      const clsByCode = await prisma.class.findUnique({ where: { code: body.code } });
      if (!clsByCode || clsByCode.id !== classId) {
        return NextResponse.json({ error: "Wrong class code" }, { status: 400 });
      }
    }

    // ensure class exists
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // create enrollment if not exists
    const existing = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId } },
    }).catch(() => null);

    if (existing) return NextResponse.json({ ok: true, message: "Already joined" });

    await prisma.enrollment.create({ data: { userId, classId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/classes/[classId]/join error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
