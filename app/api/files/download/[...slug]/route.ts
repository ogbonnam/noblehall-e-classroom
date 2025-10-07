// app/api/files/download/[...slug]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// MUST match the path used in the POST route and Coolify volume mount
const PERSISTENT_DIR = process.env.UPLOAD_STORAGE_PATH ?? "/app/persistent_uploads";

export const runtime = "nodejs";

function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
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
 * GET /api/files/download/[...slug]
 * example request: GET /api/files/download/1700000000-document.pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const filename = params.slug.join('/');
  const filePath = path.join(PERSISTENT_DIR, filename);

  try {
    const fileBuffer = await fs.readFile(filePath); // Node Buffer
    const mimeType = getMimeType(filename);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error(`Attempted access to missing file: ${filename}`, error);
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
