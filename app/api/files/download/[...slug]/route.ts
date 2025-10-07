// app/api/files/download/[...slug]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PERSISTENT_DIR = process.env.UPLOAD_STORAGE_PATH ?? "/app/persistent_uploads";
export const runtime = "nodejs";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.mp4': return 'video/mp4';
    case '.mov': return 'video/quicktime';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default: return 'application/octet-stream';
  }
}

/**
 * Make the context param flexible so this file builds with different Next.js typings:
 * context.params may be either a plain object { slug: string[] } or a Promise<{ slug: string[] }>.
 */
type RouteContext =
  { params: { slug: string[] } }
  | { params: Promise<{ slug: string[] }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Await context.params — works whether it's a Promise or a plain object
  const resolved = await (context as any).params as { slug: string[] };
  const filename = resolved.slug.join('/');
  const filePath = path.join(PERSISTENT_DIR, filename);

  try {
    const fileBuffer = await fs.readFile(filePath); // Node Buffer
    const mimeType = getMimeType(filename);

    // Convert to Uint8Array so TS accepts it as BodyInit
    const body = new Uint8Array(fileBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error(`Attempted access to missing file: ${filename}`, err);
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
