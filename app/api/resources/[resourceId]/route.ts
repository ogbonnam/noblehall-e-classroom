// inside app/api/resources/[resourceId]/route.ts (DELETE handler)
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const UPLOAD_PATH = process.env.UPLOAD_STORAGE_PATH ?? path.join(process.cwd(), "public");

/**
 * Helper: resolve & sanitize a relative filePath from the DB so it is guaranteed
 * to be inside the allowed base directory.
 */
function resolveSafePath(baseDir: string, relPath?: string) {
  if (!relPath) return null;
  // remove leading slash if any
  const cleaned = relPath.replace(/^\//, "");
  const resolved = path.resolve(baseDir, cleaned);
  // ensure resolved path is inside baseDir
  const normalizedBase = path.resolve(baseDir) + path.sep;
  if (!resolved.startsWith(normalizedBase)) {
    // path traversal attempt
    return null;
  }
  return resolved;
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

export async function DELETE(req: Request, context: { params: Promise<{ resourceId: string }> }) {
  try {
    const { resourceId } = await context.params;

    // auth
    const token = extractTokenFromHeadersOrCookie(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });
    const payload = verifyToken(token as string) as any;
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // load resource with its class
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { class: true },
    });
    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    // permission: ADMIN or the teacher of the class
    const isAdmin = payload.role === "ADMIN";
    const isClassTeacher = resource.class && resource.class.teacherId === payload.id;
    if (!isAdmin && !isClassTeacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 1) delete main resource file from UPLOAD_PATH (safe)
    if (resource.filePath) {
      const fileOnUploadPath = resolveSafePath(UPLOAD_PATH, resource.filePath);
      if (fileOnUploadPath) {
        try {
          if (fs.existsSync(fileOnUploadPath)) {
            fs.unlinkSync(fileOnUploadPath);
            console.log("Deleted resource from upload path:", fileOnUploadPath);
          } else {
            console.warn("Resource file not found in upload path:", fileOnUploadPath);
          }
        } catch (e) {
          console.warn("Failed to delete resource file from upload path:", e);
        }
      } else {
        console.warn("Resource filePath failed sanitization:", resource.filePath);
      }

      // 2) fallback: try removing from public/ (legacy)
      try {
        const publicFallback = resolveSafePath(path.join(process.cwd(), "public"), resource.filePath);
        if (publicFallback && fs.existsSync(publicFallback)) {
          fs.unlinkSync(publicFallback);
          console.log("Deleted resource from public fallback path:", publicFallback);
        }
      } catch (e) {
        /* ignore fallback errors */
      }
    }

    // 3) delete submission files (same logic)
    try {
      const subs = await prisma.submission.findMany({ where: { resourceId } });
      for (const s of subs) {
        if (!s.filePath) continue;

        const sOnUploadPath = resolveSafePath(UPLOAD_PATH, s.filePath);
        if (sOnUploadPath) {
          try {
            if (fs.existsSync(sOnUploadPath)) {
              fs.unlinkSync(sOnUploadPath);
              console.log("Deleted submission from upload path:", sOnUploadPath);
            }
          } catch (e) {
            console.warn("Failed deleting submission file from upload path:", e);
          }
        } else {
          console.warn("Submission filePath failed sanitization:", s.filePath);
        }

        // public fallback
        try {
          const sPublic = resolveSafePath(path.join(process.cwd(), "public"), s.filePath);
          if (sPublic && fs.existsSync(sPublic)) {
            fs.unlinkSync(sPublic);
            console.log("Deleted submission from public fallback path:", sPublic);
          }
        } catch (e) {
          /* ignore fallback errors */
        }
      }
    } catch (e) {
      console.warn("Error listing/deleting submission files:", e);
    }

    // 4) delete DB rows in transaction
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { resourceId } }),
      prisma.resourceView.deleteMany({ where: { resourceId } }),
      prisma.resource.delete({ where: { id: resourceId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/resources/[resourceId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
