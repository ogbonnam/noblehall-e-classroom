// // app/api/resources/[resourceId]/submit/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";
// import fs from "fs";
// import path from "path";

// export const runtime = "nodejs";

// async function saveFile(file: File, uploadsDir: string, prefix = Date.now().toString()) {
//   if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
//   const safeName = (file.name || "upload").replace(/\s+/g, "-");
//   const filename = `${prefix}-${safeName}`;
//   const dest = path.join(uploadsDir, filename);
//   const buffer = Buffer.from(await file.arrayBuffer());
//   await fs.promises.writeFile(dest, buffer);
//   return { filename, destPath: dest, size: buffer.length };
// }

// export async function POST(req: Request, { params }: { params: { resourceId: string | Promise<string> } }) {
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
//     if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const studentId = payload.id;

//     const formData = await req.formData();
//     const maybeFile = formData.get("file") as File | null;
//     if (!maybeFile) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

//     const uploadsDir = path.join(process.cwd(), "public", "submissions");
//     const { filename, size } = await saveFile(maybeFile, uploadsDir);

//     const submission = await prisma.submission.create({
//       data: {
//         studentId,
//         resourceId,
//         filePath: `/submissions/${filename}`,
//         mimeType: maybeFile.type || "application/octet-stream",
//         size: Number(size),
//       },
//     });

//     return NextResponse.json({ ok: true, submission });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/resources/[resourceId]/submit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

async function saveFile(file: File, uploadsDir: string, prefix = Date.now().toString()) {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const safeName = (file.name || "upload").replace(/\s+/g, "-");
  const filename = `${prefix}-${safeName}`;
  const dest = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(dest, buffer);
  return { filename, destPath: dest, size: buffer.length };
}

/**
 * POST /api/resources/[resourceId]/submit
 * Note: Next's route handler context.params is a Promise<{ resourceId: string }>
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await context.params;

    // --- token extraction (Authorization header or cookie)
    const auth = req.headers.get("authorization") || "";
    let token: string | null = null;
    if (auth.startsWith("Bearer ")) token = auth.split(" ")[1];
    else {
      const cookie = req.headers.get("cookie") || "";
      const m = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith("token="));
      if (m) token = m.split("=")[1];
    }
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const studentId = payload.id;

    // --- parse multipart/form-data
    const formData = await req.formData();
    const maybeFile = formData.get("file") as File | null;
    if (!maybeFile) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // --- save file
    const uploadsDir = path.join(process.cwd(), "public", "submissions");
    const { filename, size } = await saveFile(maybeFile, uploadsDir);

    // --- create submission
    const submission = await prisma.submission.create({
      data: {
        studentId,
        resourceId,
        filePath: `/submissions/${filename}`,
        mimeType: maybeFile.type || "application/octet-stream",
        size: Number(size),
      },
    });

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    console.error("POST /api/resources/[resourceId]/submit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
