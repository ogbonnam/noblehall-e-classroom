// // app/api/classes/[classId]/upload/route.ts
// import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export const runtime = "nodejs";

// // Helper: save web File/Blob to disk
// async function saveFile(file: File, uploadsDir: string, prefix = Date.now().toString()) {
//   if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

//   const safeName = (file.name || "upload").replace(/\s+/g, "-");
//   const filename = `${prefix}-${safeName}`;
//   const dest = path.join(uploadsDir, filename);

//   const buffer = Buffer.from(await file.arrayBuffer());
//   await fs.promises.writeFile(dest, buffer);

//   return { filename, destPath: dest, size: buffer.length };
// }

// // Extract token from Authorization header or cookie
// function extractToken(headers: Headers): string | null {
//   const auth = headers.get("authorization") || "";
//   if (auth.startsWith("Bearer ")) return auth.split(" ")[1];

//   const cookie = headers.get("cookie") || "";
//   const tokenCookie = cookie
//     .split(";")
//     .map(s => s.trim())
//     .find(s => s.startsWith("token="));
//   if (tokenCookie) return tokenCookie.split("=")[1];

//   return null;
// }

// export async function POST(
//   req: Request,
//   { params }: { params: { classId: string | Promise<string> } }
// ) {
//   try {
//     const { classId } = (await params) as { classId: string };

//     // --- Authentication
//     const token = extractToken(req.headers);
//     if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });

//     const payload = verifyToken(token) as any;
//     if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

//     // --- Ensure teacher or admin
//     const cls = await prisma.class.findUnique({ where: { id: classId } });
//     if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
//     if (cls.teacherId !== payload.id && payload.role !== "ADMIN") {
//       return NextResponse.json({ error: "Forbidden - not allowed" }, { status: 403 });
//     }

//     // --- Parse formData
//     const formData = await req.formData();
//     const maybeFile = formData.get("file") as File | null;
//     const titleField = formData.get("title") as string | null;
//     const typeField = formData.get("type") as string | null; // NOTE, VIDEO, ASSIGNMENT, HOMEWORK

//     if (!maybeFile) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

//     // --- Determine ResourceType
//     let type: "NOTE" | "VIDEO" | "ASSIGNMENT" | "HOMEWORK";
//     const validTypes = ["NOTE","VIDEO","ASSIGNMENT","HOMEWORK"];
//     if (typeField && validTypes.includes(typeField)) {
//       type = typeField as any;
//     } else if (maybeFile.type.includes("pdf")) {
//       type = "NOTE";
//     } else if (maybeFile.type.startsWith("video/")) {
//       type = "VIDEO";
//     } else {
//       type = "NOTE";
//     }

//     // --- Save file
//     const uploadsDir = path.join(process.cwd(), "public", "uploads");
//     const { filename, size } = await saveFile(maybeFile, uploadsDir);

//     const finalTitle = titleField || maybeFile.name || filename;

//     // --- Save resource in DB
//     const resource = await prisma.resource.create({
//       data: {
//         title: finalTitle,
//         filePath: `/uploads/${filename}`,
//         mimeType: maybeFile.type || "application/octet-stream",
//         size: Number(size),
//         type,        // ✅ Correct enum value
//         classId,
//       },
//     });

//     return NextResponse.json({ ok: true, resource });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return NextResponse.json({ error: "Server error during upload" }, { status: 500 });
//   }
// }


// // app/api/classes/[classId]/upload/route.ts
// import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export const runtime = "nodejs";

// // Helper: save web File/Blob to disk
// async function saveFile(file: File, uploadsDir: string, prefix = Date.now().toString()) {
//   if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

//   const safeName = (file.name || "upload").replace(/\s+/g, "-");
//   const filename = `${prefix}-${safeName}`;
//   const dest = path.join(uploadsDir, filename);

//   const buffer = Buffer.from(await file.arrayBuffer());
//   await fs.promises.writeFile(dest, buffer);

//   return { filename, destPath: dest, size: buffer.length };
// }

// // Extract token from Authorization header or cookie
// function extractToken(headers: Headers): string | null {
//   const auth = headers.get("authorization") || "";
//   if (auth.startsWith("Bearer ")) return auth.split(" ")[1];

//   const cookie = headers.get("cookie") || "";
//   const tokenCookie = cookie
//     .split(";")
//     .map(s => s.trim())
//     .find(s => s.startsWith("token="));
//   if (tokenCookie) return tokenCookie.split("=")[1];

//   return null;
// }

// /**
//  * POST /api/classes/[classId]/upload
//  * Note: Next's route handler context.params is a Promise<{ classId: string }>
//  */
// export async function POST(
//   req: Request,
//   context: { params: Promise<{ classId: string }> }
// ) {
//   try {
//     // await the promised params and extract classId
//     const { classId } = await context.params;

//     // --- Authentication
//     const token = extractToken(req.headers);
//     if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });

//     const payload = verifyToken(token) as any;
//     if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

//     // --- Ensure teacher or admin
//     const cls = await prisma.class.findUnique({ where: { id: classId } });
//     if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
//     if (cls.teacherId !== payload.id && payload.role !== "ADMIN") {
//       return NextResponse.json({ error: "Forbidden - not allowed" }, { status: 403 });
//     }

//     // --- Parse formData
//     const formData = await req.formData();
//     const maybeFile = formData.get("file") as File | null;
//     const titleField = (formData.get("title") as string | null) ?? null;
//     const typeField = (formData.get("type") as string | null) ?? null; // NOTE, VIDEO, ASSIGNMENT, HOMEWORK

//     if (!maybeFile) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

//     // --- Determine ResourceType
//     let type: "NOTE" | "VIDEO" | "ASSIGNMENT" | "HOMEWORK";
//     const validTypes = ["NOTE","VIDEO","ASSIGNMENT","HOMEWORK"];
//     if (typeField && validTypes.includes(typeField)) {
//       type = typeField as any;
//     } else if ((maybeFile.type || "").includes("pdf")) {
//       type = "NOTE";
//     } else if ((maybeFile.type || "").startsWith("video/")) {
//       type = "VIDEO";
//     } else {
//       type = "NOTE";
//     }

//     // --- Save file
//     const uploadsDir = path.join(process.cwd(), "public", "uploads");
//     const { filename, size } = await saveFile(maybeFile, uploadsDir);

//     const finalTitle = titleField || maybeFile.name || filename;

//     // --- Save resource in DB
//     const resource = await prisma.resource.create({
//       data: {
//         title: finalTitle,
//         filePath: `/uploads/${filename}`,
//         mimeType: maybeFile.type || "application/octet-stream",
//         size: Number(size),
//         type,        // enum value
//         classId,
//       },
//     });

//     return NextResponse.json({ ok: true, resource });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return NextResponse.json({ error: "Server error during upload" }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// --- NEW CONSTANT: This is the absolute path to your persistent volume mount in Coolify
// It MUST match the "Destination Path" in Step 1.
const PERSISTENT_DIR = "/app/persistent_uploads"; 

export const runtime = "nodejs";

// Helper: save web File/Blob to disk
async function saveFile(file: File, uploadsDir: string, prefix = Date.now().toString()) {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const safeName = (file.name || "upload").replace(/\s+/g, "-");
  const filename = `${prefix}-${safeName}`;
  const dest = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(dest, buffer);

  return { filename, destPath: dest, size: buffer.length };
}

// Extract token from Authorization header or cookie (Keeping your existing auth logic)
function extractToken(headers: Headers): string | null {
  const auth = headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];

  const cookie = headers.get("cookie") || "";
  const tokenCookie = cookie
    .split(";")
    .map(s => s.trim())
    .find(s => s.startsWith("token="));
  if (tokenCookie) return tokenCookie.split("=")[1];

  return null;
}

/**
 * POST /api/classes/[classId]/upload
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    // await the promised params and extract classId
    const { classId } = await context.params;

    // --- Authentication (unchanged)
    const token = extractToken(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });

    const payload = verifyToken(token) as any;
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

    // --- Authorization (unchanged)
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.teacherId !== payload.id && payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - not allowed" }, { status: 403 });
    }

    // --- Parse formData
    const formData = await req.formData();
    const maybeFile = formData.get("file") as File | null;
    const titleField = (formData.get("title") as string | null) ?? null;
    const typeField = (formData.get("type") as string | null) ?? null;

    if (!maybeFile) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // --- Determine ResourceType (unchanged)
    let type: "NOTE" | "VIDEO" | "ASSIGNMENT" | "HOMEWORK";
    const validTypes = ["NOTE","VIDEO","ASSIGNMENT","HOMEWORK"];
    if (typeField && validTypes.includes(typeField)) {
      type = typeField as any;
    } else if ((maybeFile.type || "").includes("pdf")) {
      type = "NOTE";
    } else if ((maybeFile.type || "").startsWith("video/")) {
      type = "VIDEO";
    } else {
      type = "NOTE";
    }

    // --- Save file (Crucial Change 1: using PERSISTENT_DIR)
    const { filename, size } = await saveFile(maybeFile, PERSISTENT_DIR);

    const finalTitle = titleField || maybeFile.name || filename;

    // --- Save resource in DB (Crucial Change 2: using new API route path)
    const resource = await prisma.resource.create({
      data: {
        title: finalTitle,
        // The URL the client will use to download the file:
        filePath: `/api/files/download/${filename}`, 
        mimeType: maybeFile.type || "application/octet-stream",
        size: Number(size),
        type,      // enum value
        classId,
      },
    });

    return NextResponse.json({ ok: true, resource });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error during upload" }, { status: 500 });
  }
}
